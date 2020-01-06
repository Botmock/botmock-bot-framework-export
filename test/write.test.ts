import { join } from "path";
import { tmpdir } from "os";
import { mkdirp, readdir } from "fs-extra";
import { mockProjectData } from "./fixtures";
import { default as FileWriter } from "../lib/file";

let fileWriterInstance: FileWriter;
const outputDirectory = join(tmpdir(), mockProjectData.project.platform);
beforeAll(async () => {
  await mkdirp(outputDirectory);
  fileWriterInstance = new FileWriter({ outputDir: outputDirectory, projectData: mockProjectData });
});

beforeEach(async () => {
  await fileWriterInstance.write();
});

describe("file creation", () => {
  test("creates correctly named files", async () => {
    const contents = await readdir(outputDirectory);
    const projectName = "__botframework-project-name";
    expect(contents.includes(`${projectName}.lu`)).toBe(true);
    expect(contents.includes(`${projectName}.lg`)).toBe(true);
  });
});

describe("file content", () => {
  describe("lg file", () => {
    test.todo("includes variations defined in original project");
  });
  describe("lu file", () => {
    test.todo("includes all utterences for each intent in original project");
  });
});
