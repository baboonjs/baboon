import { BaseOptions } from "@baboonjs/api-common";

import { Access } from "./Enums";

/**
 * Optional configuration specified at bucket creation.
 * @remarks
 * In addition to specifying the bucket region, <code>CreateBucketOptions</code>
 * allow you to specify access level as "private" or "public-read". Depending
 * on the cloud platform, the access specification may translate to different
 * security mechanisms.
 */
export class CreateBucketOptions extends BaseOptions {
  /**
   * Constructs the options object with supplied provider-specific options
   * @param providerOptions Provider-specific options
   */
  constructor(providerOptions: any) {
    super(providerOptions);
  }

  /**
   * Bucket region if different than default
   */
  location?: string;

  /**
   * Access level: private or public-read
   */
  access: Access = "private";
}
