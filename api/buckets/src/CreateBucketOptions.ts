import { Options } from "@baboonjs/api-common";

import { Access } from "./Enums";

/**
 * Optional configuration specified at bucket creation
 */
export class CreateBucketOptions extends Options {
  /**
   * Bucket region if different than default
   */
  location? : string;

  /**
   * Access level: private or public-read
   */
  access : Access = "private";
}