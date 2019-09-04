import "dotenv/config";
import os from "os";
import assert from "assert";
import express from "express";
import {
  BotFrameworkAdapter,
  WebRequest,
  WebResponse,
  TurnContext,
} from "botbuilder";
import Bot, { emitter } from "./lib/Bot";

try {
  assert.notStrictEqual(typeof process.argv[2], "undefined");
} catch (_) {
  throw "requires luis app id as first argument; see README.md for more info";
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

export const app = express();

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
  app.post("/messages", (req: WebRequest, res: WebResponse): void => {
    adapter.processActivity(req, res, async (ctx: TurnContext) => {
      await bot.run(ctx);
    });
  });
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, (err: Error | null): void => {
    console.info(`connect emulator to http://localhost:${PORT}/messages`);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
