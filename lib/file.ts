import * as flow from "@botmock-api/flow";
import { wrapEntitiesWithChar } from "@botmock-api/text";
import { remove, mkdirp, writeFile } from "fs-extra";
import { join, basename } from "path";
import { EOL } from "os";

namespace BotFramework {
  export type RequiredState = { [slotName: string]: string; }[];
}

type AbstractObject<T> = { [key: string]: T; };

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
  readonly projectData: flow.ProjectData;
}

export default class FileWriter extends flow.AbstractProject {
  static multilineCharacters = "```";
  private readonly outputDir: string;
  private readonly requiredSlotsForIntentIds: flow.SlotStructure;
  private readonly boardStructureByMessagesConnectedByIntents: flow.SegmentizedStructure;
  /**
   * Creates instance of FileWriter
   * @param config Config
   */
  constructor(config: Config & any) {
    super({ projectData: config.projectData });
    this.outputDir = config.outputDir;
    this.requiredSlotsForIntentIds = this.representRequirementsForIntents();
    this.boardStructureByMessagesConnectedByIntents = this.segmentizeBoardFromMessages();
  }
  /**
   * Gets a full variable from a variable id
   * @param variableId string
   * @returns flow.Variable
   */
  private getVariable(variableId: string): flow.Variable & any {
    return this.projectData.variables.find(variable => variable.id === variableId);
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
    // @ts-ignore
    this.emit("write-complete", { filepath: basename(outputFilePath) });
  }
  /**
   * Creates conditional response template from a required slot
   * 
   * @remarks for more on conditional response templates,
   * see https://github.com/microsoft/BotBuilder-Samples/blob/master/experimental/language-generation/docs/lg-file-format.md#conditional-response-templates
   * 
   * @param state BotFramework.RequiredState
   * @param variations string
   * @returns string
   */
  private createConditionalResponseTemplateFromRequiredState(state: BotFramework.RequiredState, variations: string): string {
    return state.map((stateSlice, i) => {
      const [nameOfRequiredVariable] = Object.keys(stateSlice);
      const keyword = i === 0 ? "IF" : "ELSEIF";
      return `- ${keyword}: @{!${nameOfRequiredVariable}}${EOL}\t- ${stateSlice[nameOfRequiredVariable]}`;
    }).join(EOL).concat(`${EOL}- ELSE: ${EOL}\t${variations}`);
  }
  /**
   * Maps content block to variations in a template
   * 
   * @remarks if there is required state, build conditionals from each state slice
   * 
   * @param message content block
   * @param requiredState BotFramework.RequiredState
   * @returns string
   */
  private createVariationsFromMessageAndRequiredState(message: flow.Message, requiredState: BotFramework.RequiredState): string {
    let variations: string;
    const { multilineCharacters } = FileWriter;
    const text = message.payload.hasOwnProperty("text")
      ? this.wrapEntities(message.payload.text)
      : JSON.stringify(message.payload, null, 2);
    switch (message.message_type) {
      case "jump":
        const { selectedResult } = message.payload;
        variations = `- ${multilineCharacters}${EOL}${selectedResult.value}${EOL}${multilineCharacters}`;
        break;
      case "quick_replies":
      case "button":
        const key = message.message_type === "button" ? "buttons" : "quick_replies";
        const buttons = JSON.stringify(message.payload[key], null, 2);
        variations = `- ${multilineCharacters}${EOL}${text + EOL + buttons}${EOL}${multilineCharacters}`;
        break;
      case "image":
        variations = `- ${message.payload.image_url}`;
        break;
      case "generic":
        const payload = JSON.stringify(message.payload, null, 2);
        variations = `- ${multilineCharacters}${EOL}${payload}${EOL}${multilineCharacters}`;
        break;
      default:
        variations = `- ${text}`;
        // @ts-ignore
        const { alternate_replies } = message.payload;
        if (alternate_replies) {
          for (const reply of alternate_replies) {
            const { value } = JSON.parse(reply.body);
            variations += EOL + `- ${value}`;
          }
        }
        break;
    }
    if (requiredState.length) {
      return this.createConditionalResponseTemplateFromRequiredState(requiredState, variations);
    }
    return variations;
  }
  /**
   * Finds required slots for intents connected to message
   * @param template string
   */
  private findRequiredSlotsForConnectedIntents(idsOfConnectedIntents: string[]): BotFramework.RequiredState {
    return Array.from(this.requiredSlotsForIntentIds)
      // @ts-ignore
      .filter((requiredPairs: [string, flow.Slot[]]) => {
        const [intentId] = requiredPairs;
        return idsOfConnectedIntents.includes(intentId as string);
      })
      .reduce((acc: any[], requiredPairsForConnectedIntents: [string, flow.Slot[]]) => {
        const [, slots] = requiredPairsForConnectedIntents;
        const requiredSlots: AbstractObject<string>[] = [];
        for (const slot of slots) {
          const { name: nameOfVariable } = this.getVariable(slot.variable_id) ?? {};
          if (!nameOfVariable) {
            continue;
          }
          requiredSlots.push({
            [nameOfVariable.replace(/\s/g, "")]: slot.prompt
          });
        }
        return [
          ...acc,
          ...requiredSlots,
        ];
      }, []);
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
    // @ts-ignore
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
