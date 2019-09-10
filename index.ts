import "dotenv/config";
// @ts-ignore
import pkg from "./package.json";
import path from "path";
import assert from "assert";
import chalk from "chalk";
import * as Sentry from "@sentry/node";
import { remove, mkdirp, writeJSON } from "fs-extra";
import { getProjectAssets } from "./lib/project";
import { SENTRY_DSN } from "./lib/constants";

Sentry.init({
  dsn: SENTRY_DSN,
  release: `botmock-cli@${pkg.version}`,
});

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
} catch (err) {
  Sentry.captureException(err);
  throw "requires node.js version 10.16.0 or greater";
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
  await getProjectAssets();
  try {
    log("generating json for project");
    // const name = `${project.name}.json`;
    // await writeJSON(path.join(outputDir, name), { name: pkg.name });
  } catch (err) {
    throw err;
  }
}

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

main(process.argv).catch(err => {
  log(err.message, { hasError: true });
  Sentry.captureException(err);
});
