import "dotenv/config";
import os from "os";
import assert from "assert";
// import { createServer } from "http2";
import {
  BotFrameworkAdapter,
  WebRequest,
  WebResponse,
  TurnContext,
} from "botbuilder";
import { createServer } from "restify";
import Bot, { emitter } from "./lib/Bot";

try {
  assert.notStrictEqual(typeof process.argv[2], "undefined");
} catch (_) {
  throw "requires luis app id as first argument; see readme for more info";
}

// check that the node version meets the minimum required
try {
  const MIN_NODE_VERSION = 101600;
  const numericalNodeVersion = parseInt(
    process.version
      .slice(1)
      .split(".")
      .map(seq => seq.padStart(2, "0"))
      .join(""),
    10
  );
  assert.strictEqual(numericalNodeVersion >= MIN_NODE_VERSION, true);
} catch (_) {
  throw "requires node.js version 10.16.0 or greater";
}

export const server = createServer();

try {
  emitter.on("error", (err: Error) => {
    if (process.env.DEBUG) {
      console.error(err);
    }
  });
  const adapter = new BotFrameworkAdapter({});
  const bot = new Bot({
    token: process.env.BOTMOCK_TOKEN,
    teamId: process.env.BOTMOCK_TEAM_ID,
    projectId: process.env.BOTMOCK_PROJECT_ID,
    boardId: process.env.BOTMOCK_BOARD_ID,
  });
  // listen for training to complete after update
  emitter.on("training-complete", (projectName: string) => {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, (err: Error | null): void => {
      console.info(`Connect emulator to http://localhost:${PORT}/messages`);
    });
    // handle post requests made to /messages
    server.post("/messages", (req: WebRequest, res: WebResponse): void => {
      adapter.processActivity(req, res, async (ctx: TurnContext) => {
        await bot.run(ctx);
      });
    });
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
