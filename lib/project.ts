import fetch from "node-fetch";
import EventEmitter from "events";
import { BOTMOCK_API_URL } from "./constants";

export interface Project {
  project: {
    id: string;
    name: string;
    type: string;
    platform: string;
    created_at: {
      date: string;
      timezone_type: number;
      timezone: string
    };
    updated_at: {
      date: string;
      timezone_type: number;
      timezone: string;
    }
  };
  board: {
    board: { root_messages: any[], messages: any[] };
    slots: {};
    variables: {}[];
    created_at: {};
    updated_at: {};
  };
  intents: {
    id: string;
    name: string;
    utterances: any[];
    created_at: {};
    updated_at: {};
    is_global: boolean;
  }[];
  entities: any[];
}

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
  readonly config: Partial<Config>;
  readonly endpoints: Map<string, string>;

  constructor(config: Config) {
    super();
    this.config = config;
    this.endpoints = new Map([
      ["project", ""],
      ["intents", "/intents"],
      ["entities", "/entities"],
      ["board", `/boards/${this.config.boardId}`]
    ]);
  }

  public async fetch(): Promise<any> {
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
