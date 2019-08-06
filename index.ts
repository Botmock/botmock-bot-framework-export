import "dotenv/config";
import os from "os";
import ora from "ora";
import { BotFrameworkAdapter, WebRequest, WebResponse } from "botbuilder";
import { createServer } from "restify";
import Bot, { emitter } from "./lib/Bot";

const PORT = process.env.PORT || 8080;
const server = createServer();

try {
  const spinner = ora(`Building app.. ${os.EOL}`).start();
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
    console.warn(`${os.EOL}There are too few utterances for one or more intents.
Add >= 10 utterances for each intent to prevent training failure.`);
  });
  emitter.on(
    "training-complete",
    (projectName: string = "the most recently created app.") => {
      spinner.stop();
      console.log(`App built. Training complete.
Visit the luis.ai dashboard and publish ${projectName}`);
      server.listen(PORT, (): void => {
        console.log(
          `Connect Bot Framework Emulator to http://localhost:${PORT}/messages`
        );
      });
      // handle post requests made to /messages
      server.post("/messages", (req: WebRequest, res: WebResponse): void => {
        adapter.processActivity(req, res, async ctx => {
          await bot.run(ctx);
        });
      });
    }
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}

export default server;
