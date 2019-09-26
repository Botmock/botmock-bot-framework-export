import { join } from "path";
import { remove, readFile, readdir } from "fs-extra";
import { default as FileWriter, restoreOutput } from "../lib/file";
import * as Assets from "../lib/types";

let projectData: Assets.CollectedResponses;
const outputDir = join(__dirname, "output");
const PROJECT_NAME = "project";

beforeEach(async () => {
  await restoreOutput(outputDir);
  projectData = {
    project: {
      id: "",
      name: PROJECT_NAME,
      type: "",
      platform: "",
      created_at: {
        date: new Date().toLocaleString(),
        timezone_type: 3,
        timezone: ""
      },
      updated_at: {
        date: new Date().toLocaleString(),
        timezone_type: 3,
        timezone: ""
      }
    },
    intents: [],
    entities: [],
    variables: [],
    board: {
      board: {
        root_messages: [], messages: [{
          message_id: "",
          message_type: "",
          next_message_ids: [],
          previous_message_ids: [],
          is_root: false,
          payload: {
            nodeName: "",
            context: [],
            text: "",
            workflow_index: 1
          }
        }]
      },
      slots: {},
      variables: [],
      created_at: {
        date: new Date().toLocaleString(),
        timezone_type: 3,
        timezone: ""
      },
      updated_at: {
        date: new Date().toLocaleString(),
        timezone_type: 3,
        timezone: ""
      }
    }
  }
});

afterAll(async () => {
  await remove(outputDir);
});

test("creates correct number of files", async () => {
  await new FileWriter({ outputDir, projectData }).write();
  expect(await readdir(outputDir)).toHaveLength(2);
});

test("write method creates files in output", async () => {
  const OPENING_CHARACTERS = "> ";
  await new FileWriter({ outputDir, projectData }).write();
  expect(
    (await readFile(join(outputDir, `${PROJECT_NAME}.lg`))).toString().startsWith(OPENING_CHARACTERS)
  ).toBe(true);
});
