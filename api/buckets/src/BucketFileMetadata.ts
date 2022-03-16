import { BaseResponse } from "@baboonjs/api-common";

/**
 * Metadata describing a file in a cloud bucket
 */
export class BucketFileMetadata extends BaseResponse {
  /**
   * Creates a new <code>BucketFileMetadata</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

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
  contentType?: string;

  /**
   * File content encoding
   */
  contentEncoding?: string;

  /**
   * File size in bytes
   */
  size?: number;

  /**
   * Version ID of the file
   */
  versionId?: string;

  /**
   * Cloud platform specific metadata
   */
  other?: any;
}
