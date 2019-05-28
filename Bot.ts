import { ActivityHandler } from "botbuilder";

export class Bot extends ActivityHandler {
  constructor(config = {}) {
    super();
    this.onMessage(async (ctx, next) => {
      await ctx.sendActivity(`..${ctx.activity.text}`);
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
  }

  // onMessage() {}
  // onMembersAdded() {}
}
