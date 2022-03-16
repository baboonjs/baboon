import { BaseOptions } from "@baboonjs/api-common";

/**
 * Optional configuration specified at bucket creation
 */
export class DeleteBucketOptions extends BaseOptions {
  /**
   * Constructs the options object with supplied provider-specific options
   * @param providerOptions Provider-specific options
   */
  constructor(providerOptions: any) {
    super(providerOptions);
  }

  /**
   * Set this flag to true if you want to delete a non-empty bucket
   */
  force?: boolean = false;
}
