import { Options } from "@baboonjs/api-common";

import { Access } from "./Enums";

/**
 * Optional settings passed when uploading a file to a bucket
 */
export class PutFileOptions extends Options {
  /**
   * Mime type
   */
  contentType? : string;

  /**
   * Redirect location
   */
  redirect? : string;

  /**
   * Access level
   */
  access? : Access = "private";

  /**
   * Cloud platform dependent storage class
   */
  storageClass? : string;

  /**
   * Expiry date after which the file is to be deleted
   */
  expires? : Date;
}