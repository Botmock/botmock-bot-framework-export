import { BotFrameworkAdapter, WebRequest, WebResponse } from "botbuilder";
import { createServer } from "restify";
import { config } from "dotenv";
import Bot from "./Bot";

export const server = createServer();

interface Err extends Error {}

try {
  // bring the env variables into scope
  config();
  const bot = new Bot({
    token: process.env.BOTMOCK_TOKEN,
    teamId: process.env.BOTMOCK_TEAM_ID,
    projectId: process.env.BOTMOCK_PROJECT_ID,
    boardId: process.env.BOTMOCK_BOARD_ID,
  });
  // TODO: add optional config fields
  const adapter = new BotFrameworkAdapter({
    // appId: process.env.MS_APP_ID,
    // appPassword: process.env.MS_APP_PASSWORD,
  });
  adapter.onTurnError = async (ctx, err: Err) => {
    await ctx.sendActivity(`Error:\n${err.message}`);
  };
  const PORT = process.env.PORT || 8080;
  server.listen(
    PORT,
    (): void => {
      console.log(`Send POST requests to http://localhost:${PORT}/messages`);
    }
  );
  server.post(
    "/messages",
    (req: WebRequest, res: WebResponse): void => {
      // console.log(req);
      adapter.processActivity(req, res, async ctx => {
        await bot.run(ctx);
      });
    }
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
