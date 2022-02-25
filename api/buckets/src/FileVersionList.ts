import { ResultList } from "@baboonjs/api-common";
import { FileVersion } from "./FileVersion";

/**
 * List of versions of a file
 */
export class FileVersionList extends ResultList {
  /**
   * Array of {@link FileVersion} objects
   */
  versions: FileVersion[];
}