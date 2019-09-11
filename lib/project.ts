import fetch from "node-fetch";
import EventEmitter from "events";
// import * as Assets from "./types";
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
      ["board", `/boards/${this.config.boardId}`]
    ]);
  }
  /**
   * Fetches Botmock project assets
   * @returns Promise<{}>
   */
  public async fetch(): Promise<{}> {
    return (await Promise.all(
      // perform fetch on each endpoint
      Array.from(this.endpoints.values()).map(async (endpoint: string) => {
        const url = `${BOTMOCK_API_URL}/teams/${this.config.teamId}/projects/${this.config.projectId}`;
        const res = await fetch(`${url}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            Accept: "application/json"
          }
        });
        if (!res.ok) {
          throw res.statusText;
        }
        const [assetName] = Array.from(this.endpoints.entries()).find((pair: string[]) => pair[1] === endpoint);
        this.emit("asset-fetched", assetName);
        return {
          assetName,
          data: await res.json()
        }
      })
    )).reduce((acc, result: DataObj) => {
      return { ...acc, [result.assetName]: result.data };
    }, {});
  }
}
