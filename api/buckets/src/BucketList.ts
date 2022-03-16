import { ListResponse } from "@baboonjs/api-common";

import { Bucket } from "./Bucket";

/**
 * List of buckets returned in response to list or search query
 */
export class BucketList extends ListResponse {
  /**
   * Creates a new <code>BucketList</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * List of buckets returned in response to a search or list query
   */
  buckets: Bucket[];
}
