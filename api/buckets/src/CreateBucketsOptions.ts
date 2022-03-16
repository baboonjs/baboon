import { BaseOptions } from "@baboonjs/api-common";

/**
 * Optional settings passed to create {@link Buckets} instance
 */
export class CreateBucketsOptions extends BaseOptions {
  /**
   * Constructs the options object with supplied provider-specific options
   * @param providerOptions Provider-specific options
   */
  constructor(providerOptions: any) {
    super(providerOptions);
  }

  /**
   * Default region for bucket creation and access
   */
  region?: string;
}
