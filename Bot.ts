import { ActivityHandler, TurnContext } from "botbuilder";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import fetch from "node-fetch";
// import * as botmockUtils from "@botmock-api/utils";
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

type Intent = {
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

// export class extending botbuilder's event-emitting class
export default class Bot extends ActivityHandler {
  private recognizer: LuisRecognizerTelemetryClient;
  private intentMap: IntentMap;

  constructor({ teamId, projectId, boardId, token }: Readonly<UserConfig>) {
    super();
    (async () => {
      // GET https://app.botmock.com/api/teams/<TEAM-ID>/projects/<PROJECT-ID>/boards/<BOARD-ID>
      const baseURL = `${BOTMOCK_API_URL}/teams/${teamId}/projects/${projectId}`;
      // on boot, seed luis with intent data from the connected project
      const intents = await (await fetch(`${baseURL}/intents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })).json();
      const { board } = await (await fetch(`${baseURL}/boards/${boardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })).json();
      // store the mapping of message id -> intentful in-neighbor connection ids
      this.intentMap = createIntentMap(board.messages);
      const res: LuisImportResponse = await this.seedLuis(intents);
      if (typeof res !== "string") {
        throw res.error;
      }
      await this.trainLuis(res, LUIS_VERSION_ID);
      console.log("luis.ai project created and trained..");
    })();
    this.recognizer = new LuisRecognizer(
      {
        applicationId: process.env.LUIS_APP_ID,
        endpointKey: process.env.LUIS_ENDPOINT_KEY,
      },
      { includeAllIntents: true, log: true, staging: false }
    );
    // create handler for all incoming messages; provide suitable response for
    // identified intents
    this.onMessage(async (ctx, next) => {
      const intent = await this.getIntentFromContext(ctx);
      if (!Object.is(intent, null)) {
        // ..
      } else {
        await ctx.sendActivity(
          `"${ctx.activity.text}" does not match any intent.`
        );
      }
      await next();
    });
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
    });
  }

  // recognize the intent from the turn context
  private async getIntentFromContext(ctx: TurnContext): Promise<string | null> {
    const { luisResult } = await this.recognizer.recognize(ctx);
    return luisResult.topScoringIntent;
  }

  // seed the Luis service with intents and entities from the Botmock project
  private async seedLuis(
    nativeIntents: Partial<Intent>[],
    nativeEntities?: Entity[]
  ): Promise<any> {
    // const entities = nativeEntities.map(({ name }) => ({ name, roles: [] }));
    const name = String(Math.floor(Math.random() * 1e5));
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
    const body = {
      ...templates.luisAppStructure,
      name,
      intents,
      utterances,
      // entities,
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
