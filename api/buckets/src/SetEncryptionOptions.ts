import { BaseOptions } from "@baboonjs/api-common";

/**
 * Optional settings passed to set default encryption policy on {@link Buckets} instance
 */
export class SetEncryptionOptions extends BaseOptions {
  /**
   * Constructs the options object with supplied provider-specific options
   * @param providerOptions Provider-specific options
   */
  constructor(providerOptions: any) {
    super(providerOptions);
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
