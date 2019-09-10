import "dotenv/config";
// @ts-ignore
import pkg from "./package.json";
import path from "path";
import chalk from "chalk";
import * as Sentry from "@sentry/node";
import { remove, mkdirp, writeJSON } from "fs-extra";
import { getProjectAssets } from "./lib/project";
import { SENTRY_DSN } from "./lib/constants";

Sentry.init({
  dsn: SENTRY_DSN,
  release: `botmock-cli@${pkg.version}`,
});

export interface Project {
  intents: any[];
  variables: any[];
  entities: any[];
  meta: { name: string };
}

interface LogConfig {
  hasError: boolean;
}

function log(str: string | number, config: LogConfig = { hasError: false }): void {
  const method = !config.hasError ? "dim" : "bold";
  console.info(chalk[method](`> ${str}`))
}

async function main(args: string[]): Promise<void> {
  let [, , appId, output] = args;
  if (typeof appId === "undefined") {
    appId = process.env.LUIS_APP_ID;
  }
  const DEFAULT_OUTPUT = "output";
  const outputDir = path.join(__dirname, output || DEFAULT_OUTPUT);
  log("recreating output directory")
  await remove(outputDir);
  await mkdirp(outputDir);
  log("fetching botmock assets");
  const { intents, variables, entities } = await getProjectAssets();
  try {
    log("generating json for project");
    await writeToOutput({ intents, variables, entities }, outputDir);
  } catch (err) {
    throw err;
  }
  log("done");
}

export async function writeToOutput(project: Partial<Project>, outputDir: string): Promise<void> {
  const LUIS_SCHEMA_VERSION = "3.2.0";
  const VERSION_ID = "0.1";
  const name = `test.json`;
  return await writeJSON(
    path.join(outputDir, name),
    {
      luis_schema_version: LUIS_SCHEMA_VERSION,
      versionId: VERSION_ID,
      name: "",
      desc: "",
      culture: "en-us",
      tokenizerVersion: "1.0.0",
      intents: [],
      entities: [],
      composites: [],
      closedLists: [],
      patternAnyEntities: [],
      regex_entities: [],
      prebuiltEntities: [],
      model_features: [],
      regex_features: [],
      patterns: [],
      utterances: [],
    }
  );
}

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

main(process.argv).catch(err => {
  log(err.message, { hasError: true });
  Sentry.captureException(err);
});
