import "dotenv/config";
import assert from "assert";
import express from "express";
import chalk from "chalk";
import {
  BotFrameworkAdapter,
  WebRequest,
  WebResponse,
  TurnContext,
} from "botbuilder";
import * as inquirer from "inquirer";
import Bot, { emitter } from "./lib/Bot";

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

type QuestionObject = {
  shouldUseServer: boolean;
  appId: string;
};

(async () => {
  try {
    const prompts = [
      {
        type: "confirm",
        name: "shouldUseServer",
        message: "should botframework server be set up?",
        default: true,
      },
      {
        type: "input",
        name: "appId",
        message: "what is your luis app id?",
        default: "your-luis-app-id",
      },
    ];
    let { shouldUseServer, appId } = await inquirer.prompt<QuestionObject>(
      prompts
    );
    if (typeof appId === "undefined") {
      console.info(
        chalk.dim(
          "> no luis app id provided from command line; checking for environment variable"
        )
      );
      if (!process.env.LUIS_APP_ID) {
        throw "could not find luis app id";
      }
      appId = process.env.LUIS_APP_ID;
    }
    emitter.on("error", (err: Error) => {
      throw err;
    });
    emitter.on(
      "import-error-batch",
      (intentName: string, error: { code: string; message: string }) => {
        console.error(
          chalk.dim(
            `> problem importing "${intentName}"" utterances: ${JSON.stringify(
              error
            )}`
          )
        );
      }
    );
    // create instance of the class that syncs with luis when constructed
    const bot = new Bot(appId, {
      token: process.env.BOTMOCK_TOKEN,
      teamId: process.env.BOTMOCK_TEAM_ID,
      projectId: process.env.BOTMOCK_PROJECT_ID,
      boardId: process.env.BOTMOCK_BOARD_ID,
    });
    emitter.on("asset-restored", (assetName: string) => {
      console.info(
        chalk.dim(`> ${assetName} restored; visit your luis dashboard`)
      );
    });
    emitter.on("all-restored", () => {
      console.info(chalk.dim("> all assets restored"));
    });
    if (shouldUseServer) {
      const PORT = process.env.PORT || 8080;
      const app = express();
      const adapter = new BotFrameworkAdapter({});
      app.post("/messages", (req: WebRequest, res: WebResponse): void => {
        adapter.processActivity(req, res, async (ctx: TurnContext) => {
          await bot.run(ctx);
        });
      });
      app.listen(PORT, (err: Error | null): void => {
        console.info(
          chalk.bold(`> connect emulator to http://localhost:${PORT}/messages`)
        );
      });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
