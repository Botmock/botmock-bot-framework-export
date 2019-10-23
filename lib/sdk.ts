import Botmock from "@botmock-api/client";
import { EventEmitter } from "events";

interface Config {
  readonly token: string;
  readonly teamId: string;
  readonly projectId: string;
  readonly boardId: string;
}

export type JSONResponse = { [assetName: string]: any };

export default class SDKWrapper extends EventEmitter {
  private readonly client: Botmock;
  /**
   * Creates new instance of the SDKWrapper
   * @param config config containing botmock credentials
   */
  constructor(config: Config) {
    super();
    this.client = new Botmock({ token: config.token });
    this.client.on("error", (err: Error) => {
      throw err;
    });
  }
  /**
   * Fetches botmock project data using the SDK
   * @returns Promise<null | { data: JSONResponse }>
   */
  public async fetch(): Promise<null | { data: JSONResponse }> {
    try {
      const [projectId, teamId, boardId] = [
        process.env.BOTMOCK_PROJECT_ID,
        process.env.BOTMOCK_TEAM_ID,
        process.env.BOTMOCK_BOARD_ID
      ];
      const project = await this.client.getProject({ projectId, teamId });
      const board = await this.client.getBoard({ projectId, teamId, boardId });
      const intents = await this.client.getIntents({ projectId, teamId });
      const entities = await this.client.getEntities({ projectId, teamId });
      const variables = await this.client.getVariables({ projectId, teamId });
      return {
        data: {
          project,
          board,
          intents,
          entities,
          variables
        }
      };
    } catch (err) {
      this.emit("error", err);
      return null;
    }
  }
}
