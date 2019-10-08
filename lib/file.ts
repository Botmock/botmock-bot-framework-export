import * as flow from "@botmock-api/flow";
import { wrapEntitiesWithChar } from "@botmock-api/text";
import { remove, mkdirp, writeFile } from "fs-extra";
// import fetch from "node-fetch";
import { join } from "path";
import { EOL } from "os";
import * as Assets from "./types";
import { connect } from "tls";

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
  readonly projectData: flow.CollectedResponses
}

export default class FileWriter extends flow.AbstractProject {
  private outputDir: string;
  private intentMap: flow.SegmentizedStructure;
  private slotsMap: flow.SlotStructure;
  /**
   * Creates instance of FileWriter
   * @param config configuration object containing an outputDir to hold generated
   * files, and projectData for the original botmock flow project
   */
  constructor(config: Config & any) {
    super({ projectData: config.projectData });
    this.outputDir = config.outputDir;
    this.intentMap = this.segmentizeBoardFromMessages();
    this.slotsMap = this.representRequirementsForIntents();
  }
  /**
   * Wraps any entities in the text with braces
   * @param str string
   * @returns string
   */
  private wrapEntities(str: string): string {
    return wrapEntitiesWithChar(str, "{");
  }
  /**
   * Creates string with timestamp used in all generated files
   * @returns string
   */
  private createGenerationLine(): string {
    return `> generated ${new Date().toLocaleString()}`;
  }
  /**
   * Writes Ludown file within outputDir
   * @returns Promise<void>
   */
  private async writeLU(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${name.replace(/\s/g, "").toLowerCase()}.lu`);
    await writeFile(
      outputFilePath,
      this.projectData.intents.reduce((acc, intent: Assets.Intent) => {
        const template = `# ${intent.name}`;
        const variations = intent.utterances.map((utterance: Assets.Utterance) => (
          `- ${this.wrapEntities(utterance.text)}`
        )).join(EOL);
        return [acc, template, variations].join(EOL) + EOL;
      }, this.createGenerationLine())
    );
  }
  /**
   * Fetches project referenced in jump node
   * @param message 
   * @todo
   */
  // private async fetchJumpedToProject(): Promise<void> {}
  /**
   * Maps content block to the correct lg format
   * @param message content block
   * @returns string
   */
  private mapContentBlockToLGResponse(message: Assets.Message, state: string): string {
    const MULTILINE_SYMBOL = "```";
    const text = message.payload.hasOwnProperty("text")
      ? this.wrapEntities(message.payload.text)
      : JSON.stringify(message.payload, null, 2);
    switch (message.message_type) {
      // case "api":
      case "jump":
        const { selectedResult } = message.payload;
        return `- ${MULTILINE_SYMBOL}${EOL}${selectedResult.value}${EOL}${MULTILINE_SYMBOL}`;
      case "quick_replies":
      case "button":
        const key = message.message_type === "button" ? "buttons" : "quick_replies";
        const buttons = JSON.stringify(message.payload[key], null, 2);
        return `- ${MULTILINE_SYMBOL}${EOL}${text + EOL + buttons}${EOL}${MULTILINE_SYMBOL}`;
      case "image":
        return `- ${message.payload.image_url}`;
      case "generic":
        const payload = JSON.stringify(message.payload, null, 2);
        return `- ${MULTILINE_SYMBOL}${EOL}${payload}${EOL}${MULTILINE_SYMBOL}`;
      default:
        return `- ${text}`;
    }
  }
  /**
   * Computes the conversation scope data for the project
   * @param template string
   * @returns string
   * @todo
   */
  private findRequirementsForTemplate(connectedIntentIds: string[]): string {
    return "";
  }
  /**
   * Writes Language Generation file within outputDir
   * @returns Promise<void>
   */
  private async writeLG(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${name.replace(/\s/g, "").toLowerCase()}.lg`);
    await writeFile(
      outputFilePath,
      Array.from(this.intentMap.entries()).reduce((acc, entry: any[]) => {
        const [idOfMessageConnectedByIntent, connectedIntentIds] = entry;
        // @ts-ignore
        const message: Assets.Message = this.getMessage(idOfMessageConnectedByIntent) || {};
        const requiredState = this.findRequirementsForTemplate(connectedIntentIds);
        const variations = this.mapContentBlockToLGResponse(message, requiredState);
        const comment = `> ${message.payload.nodeName}`;
        const template = `# ${message.message_id}`;
        return [acc, comment, template, variations].join(EOL) + EOL;
      }, this.createGenerationLine())
    );
  }
  /**
   * Writes all files produced by the exporter
   * @returns Promise<void>
   */
  public async write(): Promise<void> {
    await this.writeLU();
    await this.writeLG();
  }
}
