import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import { ActivityHandler, TurnContext } from "botbuilder";
import { createIntentMap } from "@botmock-api/utils";
import uuid from "uuid/v4";
import fetch from "node-fetch";
import EventEmitter from "events";
import * as templates from "./templates";
import {
  Intent,
  Utterance,
  Entity,
  LuisImportResponse,
  LuisTrainResponse,
} from "./types";

const BOTMOCK_API_URL = "https://app.botmock.com/api";
const LUIS_API_URL = "https://westus.api.cognitive.microsoft.com/luis/api/v2.0";
const LUIS_VERSION_ID = "0.2";

export interface UserConfig {
  token: string;
  teamId: string;
  projectId: string;
  boardId: string;
}

export const emitter = new EventEmitter();

// export class extending botbuilder's event-emitting class
export default class Bot extends ActivityHandler {
  private recognizer: LuisRecognizerTelemetryClient;
  private intentMap: any;
  private luisAppId: string;
  constructor({ teamId, projectId, boardId, token }: Readonly<UserConfig>) {
    super();
    // get resources from botmock api and add them to existing luis app
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
      const appId = process.argv[2];
      const { name } = await this.getLuisApplication(appId);
      emitter.emit("app-connection", name);
      try {
        // await this.trainLuis(appId, LUIS_VERSION_ID);
        emitter.emit("train");
      } catch (_) {
        throw "failed to train model";
      }
      this.recognizer = new LuisRecognizer(
        {
          applicationId: appId,
          endpointKey: process.env.LUIS_ENDPOINT_KEY,
        },
        { includeAllIntents: true, log: true, staging: false }
      );
      // create mapping of message ids to array of connected intent ids
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

  private async getLuisApplication(id: string): Promise<any> {
    const res = await fetch(`${LUIS_API_URL}/apps/${id}`, {
      headers: { "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY },
    });
    if (!res.ok) {
      throw res.statusText;
    }
    const json = await res.json();
    return json;
  }

  // seed the Luis service with intents and entities from the Botmock project
  private async seedLuis(
    nativeIntents: Partial<Intent>[],
    nativeEntities?: Entity[]
  ): Promise<any> {
    const entities = nativeEntities.map(({ name }) => ({ name, roles: [] }));
    const intents = nativeIntents.map(({ name }) => ({ name }));
    const utterances = nativeIntents.reduce((acc, intent) => {
      return [
        ...acc,
        ...intent.utterances.map(utterance => ({
          text: utterance.text,
          intent: intent.name,
          entities: [],
        })),
      ];
    }, []);
    if (utterances.length < 10) {
      emitter.emit("few-utterances");
    }
    const name = `project-${uuid()}`;
    const body = {
      ...templates.luisAppStructure,
      name,
      intents,
      utterances,
      entities,
    };
    const url = `${LUIS_API_URL}/apps/import`;
    return await (await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })).json();
  }

  // train the luis model
  private async trainLuis(
    appId: string,
    versionId: string
  ): Promise<LuisTrainResponse> {
    const url = `${LUIS_API_URL}/apps/${appId}/versions/${versionId}/train`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw res.statusText;
    }
    return await res.json();
  }
}
