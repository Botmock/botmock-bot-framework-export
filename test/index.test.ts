import { join } from "path";
import { remove, mkdirp, readJson } from "fs-extra";
import { writeToOutput } from "../";

// const VARIABLE_NAME = "variable";
const INTENT_NAME = "intent";
const FIRST_UTTERANCE = "u";
const SECOND_UTTERANCE = "uu";
const PROJECT_NAME = "project";

let outputDir: void | string;
let filename: void | string;

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
  utterances: [
    { text: FIRST_UTTERANCE, variables: [] },
    { text: SECOND_UTTERANCE, variables: [] },
  ],
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

const variables = [];

// recreate output directory before each test runs
beforeEach(async () => {
  outputDir = join(__dirname, "output");
  filename = join(outputDir, `${PROJECT_NAME}.json`);
  // @ts-ignore
  await remove(outputDir);
  // @ts-ignore
  await mkdirp(outputDir);
  // @ts-ignore
  await writeToOutput({ project, intents, variables }, outputDir);
});

afterAll(async () => {
  // @ts-ignore
  await remove(outputDir);
});

test("project data ends up in written json", async () => {
  // @ts-ignore
  const { name } = await readJson(filename);
  expect(name).toBe(PROJECT_NAME);
});

test("intent data ends up in written json", async () => {
  // @ts-ignore
  const { intents } = await readJson(filename);
  expect(intents).toHaveLength(1);
  expect(intents[0].name).toBe(INTENT_NAME);
});

test("utterance data ends up in written json", async () => {
  // @ts-ignore
  const { utterances } = await readJson(filename);
  expect(utterances).toHaveLength(2);
  expect(
    utterances.every((utterance: any) => (
      utterance.text === FIRST_UTTERANCE || utterance.text === SECOND_UTTERANCE
    ))
  ).toBe(true);
});

test("entity data ends up in written json", async () => {
  // @ts-ignore
  const { entities } = await readJson(filename);
  expect(entities).toHaveLength(0);
});

test.todo("all entities referenced in utterances also exist in entities field");
test.todo("fetches project assets");
