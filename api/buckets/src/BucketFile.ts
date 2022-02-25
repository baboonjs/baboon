import { BucketFileMetadata } from "./BucketFileMetadata";
/**
 * A file stored in a cloud bucket
 */
export class BucketFile extends BucketFileMetadata {
  /**
    * File data/content
    */
  data: Buffer;
}