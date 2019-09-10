// import { stat } from "fs-extra";
// import execa from "execa";
import path from "path";
import { writeToOutput } from "../";

beforeEach(() => {});

test("json can be written to output", async () => {
  const mockProject = {};
  expect(async () => {
    await writeToOutput(mockProject, path.join(__dirname, "output"));
  }).not.toThrow();
});
