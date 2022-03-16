import { BaseOptions } from "./BaseOptions";

/**
 * Options passed to any operation that requests paginated lists
 */
export class ListOptions extends BaseOptions {
  /**
   * Continuation token that indicates start of the result set
   * to be returned
   */
  start?: string = null;

  /**
   * Maximum number of items to be returned
   */
  maxItems?: number = -1;
}
