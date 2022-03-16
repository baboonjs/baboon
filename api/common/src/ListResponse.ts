import { BaseResponse } from "./BaseResponse";

/**
 * Root object for all paginated response objects
 */
export class ListResponse extends BaseResponse {
  /**
   * Creates a new <code>ListResponse</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * Optional token that indicates there are more items to be
   * fetched
   */
  next?: string;
}
