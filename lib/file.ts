import uuid from "uuid/v4";
import * as utils from "@botmock-api/utils";
import { remove, mkdirp, writeFile } from "fs-extra";
import { EventEmitter } from "events";
import { join } from "path";
import { EOL } from "os";
import * as Assets from "./types";

/**
 * Recreates given path
 * @param outputDir the location of the directory that contains generated output files
 * @returns Promise<void>
 */
export async function restoreOutput(outputDir: string): Promise<void> {
  await remove(outputDir);
  await mkdirp(outputDir);
}

interface Config {
  readonly outputDir: string;
  readonly projectData: Assets.CollectedResponses
}

export default class FileWriter extends EventEmitter {
  private init: Date;
  private outputDir: string;
  private projectData: Assets.CollectedResponses;
  private intentMap: Assets.IntentMap;
  /**
   * Creates instance of FileWriter
   * @param config configuration object containing an outputDir to hold generated
   * files, and projectData for the original botmock flow project
   */
  constructor(config: Config) {
    super();
    this.init = new Date();
    this.outputDir = config.outputDir;
    this.projectData = config.projectData;
    this.intentMap = utils.createIntentMap(this.projectData.board.board.messages, this.projectData.intents);
  }
  /**
   * Gets full message from board from an id
   * @param id string
   * @returns Message
   */
  private getMessage(id: string): Assets.Message | void {
    return this.projectData.board.board.messages.find(message => message.message_id === id);
  }
  /**
   * Writes Luis file output outputDir
   * @returns Promise<void>
   */
  // private async writeLU(): Promise<void> {}
  /**
   * Writes Language Generation file within outputDir
   * @returns Promise<void>
   */
  private async writeLG(): Promise<void> {
    const OPENING_LINE = `> generated ${this.init}`;
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${name.replace(/\s/g, "").toLowerCase()}.lg`);
    await writeFile(
      outputFilePath,
      Array.from(this.intentMap.entries()).reduce((acc, entry: any[]) => {
        const [idOfMessageConnectedByIntent, connectedIntents] = entry;
        const message = this.getMessage(idOfMessageConnectedByIntent);
        const variations = `- ${message.payload.text}`;
        const template = `# ${uuid()}`;
        return acc + EOL + template + EOL + variations + EOL;
      }, OPENING_LINE)
    );
  }
  /**
   * Writes all files produced by the exporter
   * @returns Promise<void>
   */
  public async write(): Promise<void> {
    // await this.writeLU();
    await this.writeLG();
  }
}
