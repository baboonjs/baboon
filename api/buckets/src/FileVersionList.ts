import { ListResponse } from "@baboonjs/api-common";

import { FileVersion } from "./FileVersion";

/**
 * List of versions of a file
 */
export class FileVersionList extends ListResponse {
  /**
   * Creates a new <code>FileVersionList</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * Array of {@link FileVersion} objects
   */
  versions: FileVersion[];
}
