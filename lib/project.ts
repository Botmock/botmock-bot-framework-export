import fetch from "node-fetch";
import EventEmitter from "events";
import * as Assets from "./types";
import { BOTMOCK_API_URL } from "./constants";

interface Config {
  token: string;
  teamId: string;
  projectId: string;
  boardId: string;
}

type DataObj = {
  assetName: string;
  data: any;
};

export default class APIWrapper extends EventEmitter {
  readonly config: Config;
  readonly endpoints: Map<string, string>;
  /**
   * Initializes a new instance of APIWrapper
   * @param config The Botmock credentials necessary for making API calls
   */
  constructor(config: Config) {
    super();
    this.config = config;
    this.endpoints = new Map([
      ["project", ""],
      ["intents", "/intents"],
      // ["entities", "/entities"],
      ["variables", "/variables"],
      // ["board", `/boards/${this.config.boardId}`]
    ]);
  }
  /**
   * Fetches Botmock project assets
   * @returns Promise<Assets.CollectedResponses>
   */
  public async fetch(): Promise<Assets.CollectedResponses> {
    const baseUrl = `${BOTMOCK_API_URL}/teams/${this.config.teamId}/projects/${this.config.projectId}`;
    // return collected results of each promise as a single object
    return (await Promise.all(
      Array.from(this.endpoints.values())
        .map(async (endpoint: string) => {
          const url = `${baseUrl}${endpoint}`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              Accept: "application/json"
            }
          });
          if (!res.ok) {
            this.emit("error", new Error(res.statusText));
            return;
          }
          const [assetName] = Array.from(this.endpoints.entries()).find((pair: string[]) => pair[1] === endpoint);
          this.emit("asset-fetched", assetName);
          return {
            assetName,
            data: await res.json()
          }
        })
      ))
      .reduce((acc, result: DataObj) => ({ ...acc, [result.assetName]: result.data }), {});
  }
}
