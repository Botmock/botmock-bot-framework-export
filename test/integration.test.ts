import "dotenv/config";
import { remove } from "fs-extra";
import { join } from "path";
import { execSync } from "child_process";
import { EOL, tmpdir } from "os";

describe("import", () => {
  test.todo("output imports into bot framework sdk");
});

describe("run", () => {
  const pathToDefaultOutputDirectory = join(process.cwd(), "output");
  afterAll(async () => {
    await remove(pathToDefaultOutputDirectory);
  });
  test("outputs correct number of newlines", () => {
    const res = execSync("npm start");
    expect(res.toString().split(EOL)).toHaveLength(11);
  });
});

describe.skip("interaction of batcher and file writer", () => {});
