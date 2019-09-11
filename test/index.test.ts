import path from "path";
import { remove, mkdirp, readJson } from "fs-extra";
import { writeToOutput } from "../";

const outputDir = path.join(__dirname, "output");

beforeEach(async () => {
  await remove(outputDir);
  await mkdirp(outputDir);
});

test("project data ends up in written json", async () => {
  const PROJECT_NAME= "name";
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
  expect(async () => {
    await writeToOutput({ project, intents: [], entities: [] }, outputDir);
  }).not.toThrow();
  const { name } = await readJson(path.join(outputDir, `${project.name}.json`));
  expect(name).toBe(PROJECT_NAME);
});

test.todo("fetches project assets");
test.todo("all intents in original project are in json");
test.todo("all entities in original project are in json");
