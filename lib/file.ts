import * as flow from "@botmock-api/flow";
import { wrapEntitiesWithChar } from "@botmock-api/text";
import { remove, mkdirp, writeFile, outputFile } from "fs-extra";
import { join, basename } from "path";
import { EOL } from "os";
import * as BotFramework from "./types";

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
  private async writeLUFile(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${this.formatFilename(name)}.lu`);
    await writeFile(
      outputFilePath,
      this.projectData.intents.reduce((acc, intent: flow.Intent) => {
        const template = `# ${intent.name}`;
        const variations = intent.utterances.map(utterance => (
          `- ${this.wrapEntities(utterance.text)}`
        )).join(EOL);
        return [acc, template, variations].join(EOL) + EOL;
      }, this.createGenerationLine())
    );
    this.emit("write-complete", { filepath: basename(outputFilePath) });
  }
  /**
   * Maps content block to variations in a template
   * @param message content block
   * @param requiredState RequiredState
   * @returns string
   */
  private createVariationsFromMessageAndRequiredState(message: flow.Message, requiredState: BotFramework.RequiredState): string {
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
   * Finds required slots for intents connected to message
   * @param template string
   * @returns BotFramework.RequiredState
   */
  private findRequiredSlotsForConnectedIntents(idsOfConnectedIntents: string[]): BotFramework.RequiredState {
    return Array.from(this.slotsMap)
      .filter((pair: any) => {
        const [intentId] = pair;
        return idsOfConnectedIntents.includes(intentId)
      })
      .map((pair: any) => ({}));
  }
  /**
   * Writes Language Generation file within outputDir
   * 
   * @remarks for more on the .lg file format,
   * see https://github.com/microsoft/BotBuilder-Samples/blob/master/experimental/language-generation/README.md
   * 
   * @returns Promise<void>
   */
  private async writeLGFile(): Promise<void> {
    const { name } = this.projectData.project;
    const outputFilePath = join(this.outputDir, `${this.formatFilename(name)}.lg`);
    await writeFile(
      outputFilePath,
      Array.from(this.boardStructureByMessagesConnectedByIntents.entries())
        .reduce((acc, entry: [string, string[]]) => {
          const [idOfMessageConnectedByIntent, idsOfConnectedIntents] = entry;
          const message = this.getMessage(idOfMessageConnectedByIntent) as flow.Message;
          const requiredState = this.findRequiredSlotsForConnectedIntents(idsOfConnectedIntents);
          const variations = this.createVariationsFromMessageAndRequiredState(message, requiredState);
          const comment = `> ${message.payload.nodeName}`;
          const template = `# ${message.message_id}`;
          return [
            acc,
            comment,
            template,
            variations
          ].join(EOL) + EOL;
        }, this.createGenerationLine())
    );
    this.emit("write-complete", { filepath: basename(outputFilePath) });
  }
  /**
   * Writes all files produced by the exporter
   * @returns Promise<void>
   */
  public async write(): Promise<void> {
    await this.writeLUFile();
    await this.writeLGFile();
  }
}
