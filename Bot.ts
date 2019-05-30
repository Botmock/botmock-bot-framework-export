import { ActivityHandler, TurnContext } from "botbuilder";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import fetch from "node-fetch";
import * as templates from "./templates";

export interface UserConfig {
  token: string;
  teamId: string;
  projectId: string;
  boardId: string;
}

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

const BOTMOCK_API_URL = "https://app.botmock.com/api";
// const LUIS_API_URL = "";

// export class extending botbuilder's event-emitting class
export default class Bot extends ActivityHandler {
  private recognizer: LuisRecognizerTelemetryClient;

  constructor({ teamId, projectId, token }: Readonly<UserConfig>) {
    super();
    (async () => {
      const url = `${BOTMOCK_API_URL}/teams/${teamId}/projects/${projectId}/intents`;
      // on boot, seed luis with intent data from the connected project
      try {
        const intents = await (await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })).json();
        const { ok } = await this.seedLuis(intents);
        console.log(ok);
      } catch (err) {
        throw new Error("failed to upload intents to luis.ai");
      }
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
    const intents = nativeIntents;
    const entities = nativeEntities;
    const body = {
      ...templates.luisAppStructure,
      intents,
      entities,
    };
    console.log(body);
    return {};
  }
}
