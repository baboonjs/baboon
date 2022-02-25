import { Options } from "@baboonjs/api-common";

/**
 * Options passed when downloading a file
 */
export class GetFileOptions extends Options {
  /**
   * File version ID
   */
  versionId? : string;
}