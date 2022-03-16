import { BaseResponse } from "@baboonjs/api-common";

/**
 * Optional settings passed to set default encryption policy on {@link Buckets} instance
 */
export class EncryptionSettings extends BaseResponse {
  /**
   * Creates a new <code>EncryptionSettings</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * Encryption algorithm
   */
  algorithm?: string;

  /**
   * ID of the key stored in cloud-provider's KMS
   */
  keyId?: string;
}
