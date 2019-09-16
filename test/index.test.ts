import { remove, readFile } from "fs-extra";
import { join } from "path";
import FileWriter, { restoreOutput } from "../lib/file";

const outputDir = join(__dirname, "output");

beforeEach(async () => {
  await restoreOutput(outputDir);
});

afterAll(async () => {
  await remove(outputDir);
});

test("write lg method creates file in output", async () => {
  await new FileWriter({ outputDir, projectData: { project: { name: "project" }, intents: [] } }).writeLG();
  expect((await readFile(join(outputDir, "project.lg"))).toString().startsWith(">")).toBe(true);
});
