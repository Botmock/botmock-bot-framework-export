import { join } from "path";
import { remove, readFile } from "fs-extra";
import { default as FileWriter, restoreOutput } from "../lib/file";

let projectData: any;
const outputDir = join(__dirname, "output");

beforeEach(async () => {
  await restoreOutput(outputDir);
  projectData = { project: { name: "project" }, intents: [] };
});

afterAll(async () => {
  await remove(outputDir);
});

test("write method creates files in output", async () => {
  const OPENING_CHARACTERS = "> "
  await new FileWriter({ outputDir, projectData }).write();
  expect(
    (await readFile(join(outputDir, "project.lg"))).toString().startsWith(OPENING_CHARACTERS)
  ).toBe(true);
});
