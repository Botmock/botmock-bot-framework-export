import { BotFrameworkAdapter, WebRequest, WebResponse } from "botbuilder";
import { createServer } from "restify";
import { config } from "dotenv";
import Bot, { emitter } from "./Bot";

export const server = createServer();

const PORT = process.env.PORT || 8080;

try {
  // bring the env variables into scope
  config();
  const adapter = new BotFrameworkAdapter({});
  const bot = new Bot({
    token: process.env.BOTMOCK_TOKEN,
    teamId: process.env.BOTMOCK_TEAM_ID,
    projectId: process.env.BOTMOCK_PROJECT_ID,
    boardId: process.env.BOTMOCK_BOARD_ID,
  });
  // TODO: ..
  emitter.on("few-utterances", (intent: {}) => {});
  // wait until luis.ai model generation has completed before listening on port
  emitter.on("seed-complete", () => {
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
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
