import { Options } from "@baboonjs/api-common";

/**
 * Optional settings passed to set default encryption policy on {@link Buckets} instance
 */
export class SetEncryptionOptions extends Options {
  /**
   * Encryption algorithm
   */
  algorithm? : string;

  /**
   * ID of the key stored in cloud-provider's KMS
   */
  keyId? : string;
}