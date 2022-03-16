import { ListResponse } from "@baboonjs/api-common";

import { BucketFileMetadata } from "./BucketFileMetadata";
/**
 * List of files stored in a bucket returned by a list or search query
 */
export class BucketFileList extends ListResponse {
  /**
   * Creates a new <code>BucketFileList</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * List of files and associated metadata
   */
  files: BucketFileMetadata[];

  /**
   * List of subfolders
   */
  folders?: string[];
}
