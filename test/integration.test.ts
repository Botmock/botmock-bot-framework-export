import "dotenv/config";
import { EOL, tmpdir } from "os";
import { execSync } from "child_process";
import { default as SDKWrapper } from "../lib/sdk";
import { default as FileWriter } from "../lib/file";

describe("run", () => {
  test("outputs correct number of newlines", () => {
    const res = execSync("npm start");
    expect(res.toString().split(EOL)).toHaveLength(10);
  });
});

describe("interaction of sdk wrapper and file writer", () => {
  let sdkWrapperInstance: SDKWrapper;
  const outputDirectory = tmpdir();
  beforeEach(() => {
    const [token, teamId, projectId, boardId] = [
      process.env.BOTMOCK_TOKEN,
      process.env.BOTMOCK_TEAM_ID,
      process.env.BOTMOCK_PROJECT_ID,
      process.env.BOTMOCK_BOARD_ID
    ];
    sdkWrapperInstance = new SDKWrapper({ token, teamId, projectId, boardId });
  });
  test("return value of sdk wrapper is consumable by file writer", async () => {
    const { data } = await sdkWrapperInstance.fetch();
    expect(() => {
      new FileWriter({ outputDirectory, projectData: data });
    }).not.toThrow();
  });
});
