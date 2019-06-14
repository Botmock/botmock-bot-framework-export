if (process.env.NODE_ENV === "test") {
  // necessary for ts-jest
  (window as any).global = window;
}

import { BotFrameworkAdapter, WebRequest, WebResponse } from "botbuilder";
import { createServer } from "restify";
import { config } from "dotenv";
import ora from "ora";
import Bot, { emitter } from "./Bot";

const PORT = process.env.PORT || 8080;
const server = createServer();

try {
  // bring the env variables into scope
  config();
  const spinner = ora("building app..").start();
  const adapter = new BotFrameworkAdapter({});
  const bot = new Bot({
    token: process.env.BOTMOCK_TOKEN,
    teamId: process.env.BOTMOCK_TEAM_ID,
    projectId: process.env.BOTMOCK_PROJECT_ID,
    boardId: process.env.BOTMOCK_BOARD_ID,
  });
  emitter.on("error", (err: Error) => {
    if (process.env.DEBUG) {
      console.error(err);
    }
  });
  emitter.on("few-utterances", () => {
    console.warn(`There are too few utterances for one or more intents.
Add >= 10 utterances for each intent to prevent training failure.`);
  });
  emitter.on(
    "training-complete",
    (projectName: string = "the most recently created app.") => {
      spinner.stop();
      console.log(`App built. Training complete.
Visit the luis.ai dashboard and publish ${projectName}`);
      server.listen(
        PORT,
        (): void => {
          console.log(
            `Finally, connect Bot Framework Emulator to http://localhost:${PORT}/messages`
          );
        }
      );
      // handle post requests made to /messages
      server.post(
        "/messages",
        (req: WebRequest, res: WebResponse): void => {
          adapter.processActivity(req, res, async ctx => {
            await bot.run(ctx);
          });
        }
      );
    }
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}

export default server;
