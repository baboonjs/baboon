import { ResultList } from "@baboonjs/api-common";
import { BucketFileMetadata } from "./BucketFileMetadata";
/**
 * List of files stored in a bucket returned by a list or search query
 */
export class BucketFileList extends ResultList {

  /**
   * List of files and associated metadata
   */
  files : BucketFileMetadata[];

  /**
   * List of subfolders
   */
  folders? : string[];
}