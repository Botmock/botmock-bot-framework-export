import { ActivityHandler, TurnContext } from "botbuilder";
import { LuisRecognizer, LuisRecognizerTelemetryClient } from "botbuilder-ai";
// import fetch from "node-fetch";

export interface UserConfig {
  token: string;
  teamId: string;
  projectId: string;
  boardId: string;
}

type Readonly<I> = { readonly [P in keyof I]: I[P] };

// Export class extending botbuilder's event-emitting class
export default class Bot extends ActivityHandler {
  recognizer: LuisRecognizerTelemetryClient;

  constructor(userConfig: Readonly<UserConfig>) {
    super();
    // this.userConig = userConfig;
    this.recognizer = new LuisRecognizer(
      {
        applicationId: process.env.LUIS_APP_ID,
        endpointKey: process.env.LUIS_ENDPOINT_KEY,
        // azureRegion: process.env.AZURE_REGION
      },
      { includeAllIntents: true, log: true, staging: false }
    );
    this.onMessage(async (ctx, next) => {
      // const intent = await this.doNLP(ctx);
      // console.log(intent);
      await ctx.sendActivity(`:: ${ctx.activity.text}`);
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
  private async doNLP(ctx: TurnContext): Promise<string | null> {
    const { luisResult } = await this.recognizer.recognize(ctx);
    return luisResult.topScoringIntent;
  }

  // seed the Luis service with intents from the Botmock project
  private async seedLuis(): Promise<void> {}
}
