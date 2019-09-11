import path from "path";
import { remove, mkdirp, readJson } from "fs-extra";
import { writeToOutput } from "../";

const outputDir = path.join(__dirname, "output");

beforeEach(async () => {
  await remove(outputDir);
  await mkdirp(outputDir);
});

test.todo("fetches project assets");

test("project data ends up in written json", async () => {
  const project = {
    id: 'f4386c70-c7f3-11e9-ab7c-89f5975ad745',
    name: 'gen',
    type: 'flow',
    platform: 'generic',
    created_at: {
      date: '2019-08-26 11:23:39.000000',
      timezone_type: 3,
      timezone: 'UTC'
    },
    updated_at: {
      date: '2019-09-05 17:36:26.000000',
      timezone_type: 3,
      timezone: 'UTC'
    }
  };
  expect(async () => {
    await writeToOutput({ project, intents: [], entities: [] }, outputDir);
  }).not.toThrow();
  const { name } = await readJson(path.join(outputDir, `${project.name}.json`));
  expect(name).toBe("gen");
});

test.todo("all intents in original project are in json");
test.todo("all entities in original project are in json");
