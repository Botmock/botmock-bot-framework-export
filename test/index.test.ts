import path from "path";
// import execa from "execa";
// import { stat } from "fs-extra";
import { writeToOutput } from "../";

// beforeEach(() => {});

test("json can be written to output", async () => {
  const mockProject = {};
  expect(async () => {
    await writeToOutput(mockProject, path.join(__dirname, "output"));
  }).not.toThrow();
});
