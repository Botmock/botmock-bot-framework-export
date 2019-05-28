import { ActivityHandler } from "botbuilder";
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
  constructor(userConfig: Readonly<UserConfig>) {
    super();
    // console.log(userConfig);
    this.onMessage(async (ctx, next) => {
      await ctx.sendActivity(`: ${ctx.activity.text}`);
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
}
