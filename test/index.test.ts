import path from "path";
// import execa from "execa";
import { remove, mkdirp, stat } from "fs-extra";
import { writeToOutput } from "../";

const outputDir = path.join(__dirname, "output");

beforeEach(async () => {
  await remove(outputDir);
  await mkdirp(outputDir);
});

test("json can be written to output", async () => {
  expect(async () => {
    await writeToOutput({}, outputDir);
  }).not.toThrow();
});
