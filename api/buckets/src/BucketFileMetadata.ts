/**
 * Metadata describing a file in a cloud bucket
 */
export class BucketFileMetadata {
  /**
   * Folder or prefix of the file
   */
  path: string;

  /**
   * Last modification date
   */
  lastModified: Date;

  /**
   * Cloud platform-specific storage class
   */
  storageClass: string;

  /**
   * Expiration date
   */
  expires?: Date;

  /**
   * Mime type of the file
   */
  contentType? : string;

  /**
   * File content encoding
   */
  contentEncoding? : string;

  /**
   * File size in bytes
   */
  size? : number;

  /**
   * Cloud platform specific metadata
   */
  other? : any
}