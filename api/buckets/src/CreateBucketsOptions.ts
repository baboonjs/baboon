import { Options } from "@baboonjs/api-common";

/**
 * Optional settings passed to create {@link Buckets} instance
 */
export class CreateBucketsOptions extends Options {
  /**
   * Default region for bucket creation and access
   */
  region? : string = "us-east-1";
}