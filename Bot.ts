import { ActivityHandler, TurnContext } from "botbuilder";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
import fetch from "node-fetch";

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

// export class extending botbuilder's event-emitting class
export default class Bot extends ActivityHandler {
  private recognizer: LuisRecognizerTelemetryClient;

  // on boot, seed luis with intent data from the connected project and provide
  // handlers for incoming bot activity
  constructor({ teamId, projectId, token }: Readonly<UserConfig>) {
    super();
    (async () => {
      const url = `${BOTMOCK_API_URL}/teams/${teamId}/projects/${projectId}/intents`;
      const res = await (await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })).json();
      console.log(res);
    })();
    this.recognizer = new LuisRecognizer(
      {
        applicationId: process.env.LUIS_APP_ID,
        endpointKey: process.env.LUIS_ENDPOINT_KEY,
        // azureRegion: process.env.AZURE_REGION
      },
      { includeAllIntents: true, log: true, staging: false }
    );
    this.onMessage(async (ctx, next) => {
      const intent = await this.getIntentFromContext(ctx);
      // ..
      if (!Object.is(intent, null)) {
        // ..
      } else {
        await ctx.sendActivity(
          `"${ctx.activity.text}" does not match any intent.`
        );
      }
      await next();
    });
    this.onMembersAdded(async (ctx, next) => {
      for (const member of ctx.activity.membersAdded) {
        if (member.id !== ctx.activity.recipient.id) {
          await ctx.sendActivity(`${member.id} has joined the conversation`);
        }
      }
      await next();
    });
    this.onMembersRemoved(async (ctx, next) => {
      for (const member of ctx.activity.membersRemoved) {
        await ctx.sendActivity(`${member.id} has left the conversation`);
      }
    });
  }

  // recognize the intent from the turn context
  private async getIntentFromContext(ctx: TurnContext): Promise<string | null> {
    const { luisResult } = await this.recognizer.recognize(ctx);
    return luisResult.topScoringIntent;
  }

  // seed the Luis service with intents from the Botmock project
  private async seedLuis(
    intents: Partial<Intent>[],
    entities?: Entity[]
  ): Promise<void> {
    // ..
  }
}
