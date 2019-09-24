import { join } from "path";
import { remove, readFile } from "fs-extra";
import { default as FileWriter, restoreOutput } from "../lib/file";

const outputDir = join(__dirname, "output");

beforeEach(async () => {
  await restoreOutput(outputDir);
});

afterAll(async () => {
  await remove(outputDir);
});

test("write method creates files in output", async () => {
  await new FileWriter({ outputDir, projectData: { project: { name: "project" }, intents: [] } }).write();
  expect((await readFile(join(outputDir, "project.lg"))).toString().startsWith(">")).toBe(true);
});
