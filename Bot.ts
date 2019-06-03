import { ActivityHandler, TurnContext } from "botbuilder";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import uuid from "uuid/v4";
import fetch from "node-fetch";
import EventEmitter from "events";
import * as templates from "./templates";
import { createIntentMap, IntentMap } from "./utils";

type Utterance = {
  text: string;
  variables: {
    id: string;
    name: string;
    entity: string;
    start_index: number;
  }[];
};

export type Intent = {
  id: string;
  name: string;
  utterances: Utterance[];
};

type Entity = {
  id: string;
  name: string;
  data: { value: string; synonyms: string[] }[];
};

type LuisImportResponse = string | { error: Error };

type LuisTrainResponse =
  | { statusId: number; status: string }
  | { error: Error };

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
  private intentMap: IntentMap;
  private luisAppId: string;

  // on boot, seed luis with intent data from the connected project and add activity
  // event handlers
  constructor({ teamId, projectId, boardId, token }: Readonly<UserConfig>) {
    super();
    (async () => {
      const baseURL = `${BOTMOCK_API_URL}/teams/${teamId}/projects/${projectId}`;
      // make api requests for intents, entities, and the board
      const [intents, entities, board] = await Promise.all(
        ["intents", "entities", `boards/${boardId}`].map(async path => {
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
        })
      );
      // store the mapping of message id -> in-neighbor intents to later produce
      // correct bot responses in the context of conversation
      this.intentMap = createIntentMap(board.messages, intents);
      const res: LuisImportResponse = await this.seedLuis(intents, entities);
      if (typeof res !== "string") {
        throw res.error;
      }
      await this.trainLuis(res, LUIS_VERSION_ID);
      emitter.emit("train-complete");
      // create instance of the recognized from newly-created app id
      this.recognizer = new LuisRecognizer(
        {
          applicationId: res,
          endpointKey: process.env.LUIS_ENDPOINT_KEY,
        },
        { includeAllIntents: true, log: true, staging: false }
      );
      // create handler for all incoming messages
      this.onMessage(async (ctx, next) => {
        const intentName: string | void = await this.getIntentFromContext(ctx);
        if (typeof intentName !== "undefined") {
          Array.from(this.intentMap)
            .filter(([messageId, intents]) =>
              intents.some(intent => intent.name === intentName)
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
    const { intents } = await this.recognizer.recognize(ctx);
    const [topIntent] = Object.keys(intents).sort(
      (prevKey, curKey) => intents[curKey].score - intents[prevKey].score
    );
    return topIntent;
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
    const body = {
      ...templates.luisAppStructure,
      name: uuid(),
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
    return await (await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.LUIS_ENDPOINT_KEY,
        "Content-Type": "application/json",
      },
    })).json();
  }
}
