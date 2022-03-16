import { BucketFileMetadata } from "./BucketFileMetadata";
/**
 * A file stored in a cloud bucket
 */
export class BucketFile extends BucketFileMetadata {
  /**
   * Creates a new <code>BucketFile</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * File data/content
   */
  data: Buffer;
}
