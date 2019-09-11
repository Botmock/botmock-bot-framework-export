import path from "path";
import { remove, mkdirp, readJson } from "fs-extra";
import { writeToOutput } from "../";

const outputDir = path.join(__dirname, "output");

const PROJECT_NAME = "project";
const INTENT_NAME = "intent"

const project = {
  id: "",
  name: PROJECT_NAME,
  type: "flow",
  platform: "generic",
  created_at: {
    date: new Date().toLocaleDateString(),
    timezone_type: 3,
    timezone: "UTC"
  },
  updated_at: {
    date: new Date().toLocaleDateString(),
    timezone_type: 3,
    timezone: "UTC"
  },
};
const intents = [{
  id: "",
  name: INTENT_NAME,
  utterances: [],
  created_at: {
    date: new Date().toLocaleDateString(),
    timezone_type: 3,
    timezone: "UTC"
  },
  updated_at: {
    date: new Date().toLocaleDateString(),
    timezone_type: 3,
    timezone: "UTC"
  },
  is_global: false
}];
const entities = [];

// recreate output directory before each test runs
beforeEach(async () => {
  await remove(outputDir);
  await mkdirp(outputDir);
  await writeToOutput({ project, intents, entities }, outputDir);
});

test("project data ends up in written json", async () => {  
  const { name } = await readJson(path.join(outputDir, `${project.name}.json`));
  expect(name).toBe(PROJECT_NAME);
});

test("intent data ends up in written json", async () => {
  const { intents } = await readJson(path.join(outputDir, `${project.name}.json`));
  expect(intents).toHaveLength(1);
  expect(intents[0].name).toBe(INTENT_NAME);
});

test.todo("entity data ends up in written json");
test.todo("pre-built entity data ends up in written json");
test.todo("fetches project assets");
