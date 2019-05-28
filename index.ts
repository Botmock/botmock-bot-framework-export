import { BotFrameworkAdapter, WebRequest, WebResponse } from "botbuilder";
import { createServer } from "restify";
import { config } from "dotenv";
import Bot from "./Bot";

// bring the env variables into scope
config();

const PORT = process.env.PORT || 8080;
const server = createServer();

try {
  const bot = new Bot({
    token: process.env.BOTMOCK_TOKEN,
    teamId: process.env.BOTMOCK_TEAM_ID,
    projectId: process.env.BOTMOCK_PROJECT_ID,
    boardId: process.env.BOTMOCK_BOARD_ID,
  });
  const adapter = new BotFrameworkAdapter({
    appId: process.env.MS_APP_ID,
    appPassword: process.env.MS_APP_PASSWORD,
  });
  adapter.onTurnError = async (ctx, err) => {
    console.log(err);
    await ctx.sendActivity(err.message);
  };
  server.listen(
    PORT,
    (): void => {
      console.log(`Listening on http://localhost:${PORT}`);
      console.log(
        `Sending a POST request to /messages will send a message to the bot`
      );
    }
  );
  server.post(
    "/messages",
    (req: WebRequest, res: WebResponse): void => {
      adapter.processActivity(req, res, async ctx => {
        await bot.run(ctx);
      });
    }
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
