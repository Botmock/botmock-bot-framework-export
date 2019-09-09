import { createIntentMap } from "@botmock-api/utils";
import { LUISAuthoringClient } from "@azure/cognitiveservices-luis-authoring";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import { ActivityHandler, TurnContext } from "botbuilder";
import fetch from "node-fetch";
import EventEmitter from "events";
import {
  Intent,
  Utterance,
  Entity,
  BatchAddLabelsResponse,
  LuisImportResponse,
  LuisTrainResponse,
} from "./types";

const BOTMOCK_API_URL = "https://app.botmock.com/api";

interface UserConfig {
  token: string;
  teamId: string;
  projectId: string;
  boardId: string;
}

interface Project {
  intents: any[];
  entities: any[];
  board: any;
}

export const emitter = new EventEmitter();

export default class Bot extends ActivityHandler {
  private recognizer: LuisRecognizerTelemetryClient;
  private client: LUISAuthoringClient;
  private intentMap: Map<string, string[]>;
  private readonly versionId = "0.1";
  private appId: string;

  // restore existing luis app with resources from botmock project
  constructor(
    appId: string,
    { teamId, projectId, boardId, token }: Readonly<UserConfig>
  ) {
    super();
    const credentials = new CognitiveServicesCredentials(
      process.env.LUIS_ENDPOINT_KEY
    );
    this.client = new LUISAuthoringClient(
      credentials,
      "https://westus.api.cognitive.microsoft.com"
    );
    this.appId = appId;
    (async () => {
      const baseURL = `${BOTMOCK_API_URL}/teams/${teamId}/projects/${projectId}`;
      const [intents, entities, variables, board] = await Promise.all(
        ["intents", "entities", "variables", `boards/${boardId}`].map(
          async (path: string) => {
            const res = await (await fetch(`${baseURL}/${path}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })).json();
            if (path.startsWith("boards")) {
              return res.board;
            } else {
              return res;
            }
          }
        )
      );
      try {
        await this.restoreLuisAppWithProjectData({ intents, entities, board });
        emitter.emit("all-restored");
      } catch (err) {
        emitter.emit("error", err);
      }
      this.recognizer = new LuisRecognizer(
        {
          applicationId: this.appId,
          endpointKey: process.env.LUIS_ENDPOINT_KEY,
        },
        { includeAllIntents: true, log: true, staging: false }
      );
      // mapping of message ids to array of connected intent ids
      this.intentMap = createIntentMap(board.messages, intents);
      // create handler for all incoming messages
      this.onMessage(async (ctx, next) => {
        const intentName: string | void = await this.getIntentFromContext(ctx);
        if (typeof intentName !== "undefined") {
          // send a response for each message following this intent
          Array.from(this.intentMap)
            .filter(([messageId, intentIds]) =>
              intentIds.some(
                id =>
                  (intents.find(intent => intent.id === id) || {}).name ===
                  intentName
              )
            )
            .map(([messageId]) => messageId)
            .forEach(async id => {
              const message = board.messages.find(
                message => message.message_id === id
              );
              await ctx.sendActivity(message.payload.text);
            });
        } else {
          await ctx.sendActivity(
            `"${ctx.activity.text}" does not match any intent.`
          );
        }
        await next();
      });
    })();
    // create handler for incoming user
    this.onMembersAdded(async (ctx, next) => {
      for (const member of ctx.activity.membersAdded) {
        if (member.id !== ctx.activity.recipient.id) {
          await ctx.sendActivity(`${member.id} has joined the conversation.`);
        }
      }
      await next();
    });
    // create handler for outgoing user
    this.onMembersRemoved(async (ctx, next) => {
      for (const member of ctx.activity.membersRemoved) {
        await ctx.sendActivity(`${member.id} has left the conversation.`);
      }
      await next();
    });
  }

  // recognize the intent from the turn context
  private async getIntentFromContext(ctx: TurnContext): Promise<string | void> {
    const SCORE_THRESHOLD = 0.8;
    try {
      const { intents } = await this.recognizer.recognize(ctx);
      const [topIntent] = Object.keys(intents)
        .filter(name => intents[name].score >= SCORE_THRESHOLD)
        .sort(
          (prevKey, curKey) => intents[curKey].score - intents[prevKey].score
        );
      return topIntent;
    } catch (err) {
      emitter.emit("error", err);
      const { topScoringIntent = {} } = err.body;
      if (
        topScoringIntent.intent &&
        topScoringIntent.score >= SCORE_THRESHOLD
      ) {
        return topScoringIntent.intent;
      }
    }
  }

  private async restoreLuisAppWithProjectData(project: Project): Promise<void> {
    const luisEntities = await this.client.model.listEntities(
      this.appId,
      this.versionId
    );
    for (const { id } of luisEntities) {
      await this.client.model.deleteEntity(this.appId, this.versionId, id);
    }
    for (const { name } of project.entities) {
      await this.client.model.addEntity(this.appId, this.versionId, { name });
    }
    const luisIntents = await this.client.model.listIntents(
      this.appId,
      this.versionId
    );
    for (const { id, name } of luisIntents) {
      // "None" intent cannot be deleted
      if (name === "None") {
        continue;
      }
      await this.client.model.deleteIntent(this.appId, this.versionId, id);
    }
    for (const { name, utterances } of project.intents) {
      await this.client.model.addIntent(this.appId, this.versionId, { name });
      const batchRes: any[] = await this.client.examples.batch(
        this.appId,
        this.versionId,
        utterances.map(utterance => {
          return {
            text: utterance.text.replace(/%/g, ""),
            intentName: name,
            entityLabels: utterance.variables.map(variable => ({
              entityName: variable.name.replace(/%/g, ""),
              startCharIndex: variable.start_index,
              endCharIndex: variable.start_index + variable.name.length,
            })),
          };
        })
      );
      for (const { error } of batchRes.filter(res => !!res.hasError)) {
        emitter.emit("import-error-batch", name, error);
      }
    }
  }
}
