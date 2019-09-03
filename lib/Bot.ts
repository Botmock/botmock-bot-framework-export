import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import { ActivityHandler, TurnContext } from "botbuilder";
import { createIntentMap } from "@botmock-api/utils";
import uuid from "uuid/v4";
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
const LUIS_API_URL = "https://westus.api.cognitive.microsoft.com/luis/api/v2.0";
const LUIS_VERSION_ID = "0.2";

interface UserConfig {
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
      await this.addUtterances(appId, intents);
      try {
        // await this.trainLuis(appId);
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

  private async getLuisApplication(appId: string): Promise<any> {
    const res = await fetch(`${LUIS_API_URL}/apps/${appId}`, {
      headers: { "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY },
    });
    if (!res.ok) {
      throw res.statusText;
    }
    const json = await res.json();
    return json;
  }

  // see https://westus.dev.cognitive.microsoft.com/docs/services/5890b47c39e2bb17b84a55ff/operations/5890b47c39e2bb052c5b9c09
  private async addUtterances(
    appId: string,
    intents: Intent[]
  ): Promise<BatchAddLabelsResponse> {
    const utterances = intents.reduce(
      (acc, intent: Intent) => [
        ...acc,
        ...intent.utterances.map(utterance => ({
          text: utterance.text,
          intentName: intent.name,
          entityLabels: utterance.variables.map(variable => ({
            entityName: "",
            startCharIndex: "",
            endCharIndex: "",
          })),
        })),
      ],
      []
    );
    if (!utterances.length) {
      return new Promise(resolve => resolve(null));
    }
    const res = await fetch(
      `${LUIS_API_URL}/apps/${appId}/versions/${LUIS_VERSION_ID}/examples`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(utterances),
      }
    );
    if (!res.ok) {
      throw res.statusText;
    }
    return await res.json();
  }

  // train the luis model
  private async trainLuis(appId: string): Promise<LuisTrainResponse> {
    const url = `${LUIS_API_URL}/apps/${appId}/versions/${LUIS_VERSION_ID}/train`;
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
