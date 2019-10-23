import * as flow from "@botmock-api/flow";
import { wrapEntitiesWithChar } from "@botmock-api/text";
import { remove, mkdirp, writeFile } from "fs-extra";
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
  readonly projectData: flow.CollectedResponses
}

export default class FileWriter extends flow.AbstractProject {
  static multilineCharacters = "```";
  private readonly outputDir: string;
  private readonly slotsMap: flow.SlotStructure;
  private readonly boardStructureByMessagesConnectedByIntents: flow.SegmentizedStructure;
  /**
   * Creates instance of FileWriter
   * @param config configuration object containing an outputDir to hold generated
   * files, and projectData for the original botmock flow project
   */
  constructor(config: Config & any) {
    super({ projectData: config.projectData });
    this.outputDir = config.outputDir;
    this.slotsMap = this.representRequirementsForIntents();
    this.boardStructureByMessagesConnectedByIntents = this.segmentizeBoardFromMessages();
  }
  /**
   * Wraps any entities in the text with correct braces
   * @param text string
   * @returns string
   */
  private wrapEntities(text: string): string {
    return wrapEntitiesWithChar(text, "{");
  }
  /**
   * Creates string with timestamp used in all generated files
   * @returns string
   */
  private createGenerationLine(): string {
    return `> generated ${new Date().toLocaleString()}`;
  }
  /**
   * Formats a filename for lu or lg files
   * @param filename string
   * @returns string
   */
  private formatFilename(filename: string): string {
    return filename.replace(/\s/g, "").toLowerCase();
  }
  /**
   * Writes Ludown file within outputDir
   * 
   * @remarks for more on the .lu file format,
   * see https://github.com/Microsoft/botbuilder-tools/blob/master/packages/Ludown/docs/lu-file-format.md
   * 
   * @returns Promise<void>
   */
  private async writeLU(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${this.formatFilename(name)}.lu`);
    await writeFile(
      outputFilePath,
      this.projectData.intents.reduce((acc, intent: Assets.Intent) => {
        const template = `# ${intent.name}`;
        const variations = intent.utterances.map(utterance => (
          `- ${this.wrapEntities(utterance.text)}`
        )).join(EOL);
        return [acc, template, variations].join(EOL) + EOL;
      }, this.createGenerationLine())
    );
  }
  /**
   * Maps content block to variations in a template
   * @param message content block
   * @param requiredState {}[]
   * @returns string
   */
  private createVariationsFromMessageAndRequiredState(message: Assets.Message, requiredState: {}[]): string {
    const { multilineCharacters } = FileWriter;
    const text = message.payload.hasOwnProperty("text")
      ? this.wrapEntities(message.payload.text)
      : JSON.stringify(message.payload, null, 2);
    switch (message.message_type) {
      case "jump":
        const { selectedResult } = message.payload;
        return `- ${multilineCharacters}${EOL}${selectedResult.value}${EOL}${multilineCharacters}`;
      case "quick_replies":
      case "button":
        const key = message.message_type === "button" ? "buttons" : "quick_replies";
        const buttons = JSON.stringify(message.payload[key], null, 2);
        return `- ${multilineCharacters}${EOL}${text + EOL + buttons}${EOL}${multilineCharacters}`;
      case "image":
        return `- ${message.payload.image_url}`;
      case "generic":
        const payload = JSON.stringify(message.payload, null, 2);
        return `- ${multilineCharacters}${EOL}${payload}${EOL}${multilineCharacters}`;
      default:
        return `- ${text}`;
    }
  }
  /**
   * Computes the conversation scope data for the project
   * @param template string
   * @returns string[]
   */
  private findRequiredSlotsForConnectedIntents(connectedIntentIds: string[]): string[] {
    return [];
  }
  /**
   * Writes Language Generation file within outputDir
   * 
   * @remarks for more on the .lg file format,
   * see https://github.com/microsoft/BotBuilder-Samples/blob/master/experimental/language-generation/README.md
   * 
   * @returns Promise<void>
   */
  private async writeLG(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${this.formatFilename(name)}.lg`);
    await writeFile(
      outputFilePath,
      Array.from(this.boardStructureByMessagesConnectedByIntents.entries())
        .reduce((acc, entry: any[]) => {
          const [idOfMessageConnectedByIntent, connectedIntentIds] = entry;
          // @ts-ignore
          const message: Assets.Message = this.getMessage(idOfMessageConnectedByIntent) || {};
          const requiredState = this.findRequiredSlotsForConnectedIntents(connectedIntentIds);
          const variations = this.createVariationsFromMessageAndRequiredState(message, requiredState);
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
