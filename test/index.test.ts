import { join } from "path";
import { remove, mkdirp, readJson } from "fs-extra";
import { writeToOutput } from "../";

const INTENT_NAME = "intent"
const PROJECT_NAME = "project";
const outputDir = join(__dirname, "output");
const filename = join(outputDir, `${PROJECT_NAME}.json`)

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

afterAll(async () => {
  await remove(outputDir);
});

test("project data ends up in written json", async () => {  
  const { name } = await readJson(filename);
  expect(name).toBe(PROJECT_NAME);
});

test("intent data ends up in written json", async () => {
  const { intents } = await readJson(filename);
  expect(intents).toHaveLength(1);
  expect(intents[0].name).toBe(INTENT_NAME);
});

test("utterance data ends up in written json", async () => {
  const { utterances } = await readJson(filename);
  expect(utterances).toHaveLength(0);
});

test("entity data ends up in written json", async () => {
  const { entities } = await readJson(filename);
  expect(entities).toHaveLength(0);
});

test.todo("fetches project assets");
