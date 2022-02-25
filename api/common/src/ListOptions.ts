import { Options } from "./Options"

/**
 * Options passed to any operation that requests paginated lists
 */
export class ListOptions extends Options {
  /**
   * Continuation token that indicates start of the result set
   * to be returned
   */
  offset?: string = null;

  /**
   * Maximum number of files to be returned
   */
  limit?: number = -1;
}