import { ListOptions } from "@baboonjs/api-common";
/**
 * Options for {@link Buckets.listFileVersions} methods
 */
export class ListFileVersionsOptions extends ListOptions {
  /**
   * File or folder path
   */
  filePath?: string;
}
