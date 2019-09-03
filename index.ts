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
  const ROUTE = "/messages";
  const PORT = process.env.PORT || 8080;
  // when app data has been fetch, alert the user
  emitter.on("app-connection", (name: string) => {
    console.info(`connected to project "${name}".`);
  });
  // when the app has been trained, begin listening on the port,
  // and process post requests made to the messages route
  emitter.on("train", () => {
    console.info("trained.");
    server.listen(PORT, (err: Error | null): void => {
      console.info(`connect emulator to http://localhost:${PORT}/messages`);
    });
    server.post(ROUTE, (req: WebRequest, res: WebResponse): void => {
      adapter.processActivity(req, res, async (ctx: TurnContext) => {
        await bot.run(ctx);
      });
    });
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
