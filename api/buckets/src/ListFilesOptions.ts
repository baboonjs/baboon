import { ListOptions } from "@baboonjs/api-common";

/**
 * Optional parameters passed to <code>listFiles</code> method on <code>Buckets</code>
 */
export class ListFilesOptions extends ListOptions {
  /**
   * Flag indicating if the file list call should return only the top
   * level files in the bucket or parent folder, or should return all
   * files regardless of their prefix or folder
   */
  recursive?: boolean;

  /**
   * Parent folder
   */
  folder?: string;
}