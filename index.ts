import "dotenv/config";
// @ts-ignore
import pkg from "./package.json";
import assert from "assert";
import chalk from "chalk";
import * as Sentry from "@sentry/node";
import { SENTRY_DSN } from "./lib/constants";
import { generateJSON } from "./lib/commands/run";

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
  // const [appId] = args
  log(args.length);
  log(typeof generateJSON);
}

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

main(process.argv).catch(err => {
  log(err.message, { hasError: true });
  Sentry.captureException(err);
});
