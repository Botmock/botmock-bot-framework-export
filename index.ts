import "dotenv/config";
// @ts-ignore
import pkg from "./package.json";
import { join } from "path";
import { EOL } from "os";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { writeJson } from "fs-extra";
import { default as FileWriter, restoreOutput } from "./lib/file";
import { default as APIWrapper } from "./lib/project";
import { SENTRY_DSN } from "./lib/constants";
import { log } from "./lib/util";
import * as Assets from "./lib/types";

declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

// Set property on global for the sake of stack traces.
// See https://docs.sentry.io/platforms/node/typescript/#2-changing-events-frames
global.__rootdir__ = __dirname || process.cwd();

Sentry.init({
  dsn: SENTRY_DSN,
  release: `${pkg.name}@${pkg.version}`,
  integrations: [new RewriteFrames({
    root: global.__rootdir__
  })]
});

async function main(args: string[]): Promise<void> {
  const DEFAULT_OUTPUT = "output";
  let [, , outputDirectory] = args;
  if (typeof outputDirectory === "undefined") {
    outputDirectory = process.env.OUTPUT_DIR;
  }
  try {
    log("recreating output directory");
    const outputDir = join(__dirname, outputDirectory || DEFAULT_OUTPUT);
    await restoreOutput(outputDir);
    const apiWrapper = new APIWrapper({
      token: process.env.BOTMOCK_TOKEN,
      teamId: process.env.BOTMOCK_TEAM_ID,
      projectId: process.env.BOTMOCK_PROJECT_ID,
      boardId: process.env.BOTMOCK_BOARD_ID,
    });
    apiWrapper.on("asset-fetched", (assetName: string) => {
      log(`fetched ${assetName}`);
    });
    apiWrapper.on("error", (err: Error) => {
      throw err;
    });
    log("fetching botmock assets");
    const projectData: Assets.CollectedResponses = await apiWrapper.fetch();
    await new FileWriter({ outputDir, projectData }).writeLG();
  } catch (err) {
    throw err;
  }
  log("done");
}

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

main(process.argv).catch(async (err: Error) => {
  log(`${err.message}${EOL}${err.stack}`, { hasError: true });
  if (!process.env.SHOULD_OPT_OUT_OF_ERROR_REPORTING) {
    Sentry.captureException(err);
  } else {
    const { message, stack } = err;
    await writeJson(join(__dirname, "err.json"), {
      message,
      stack
    });
  }
});
