/**
 * Base class for all results returned by API calls.
 * @remarks
 * Base class that provides a common mechanism to return provider-specific
 * results.
 */
export class BaseResponse {
  /**
   * Provider-specific options
   */
  rawResult?: any;

  /**
   * Creates <code>BaseResponse</code> instance with given provider options
   * @param options Provider specific options
   */
  constructor(rawResult: any) {
    this.rawResult = rawResult;
  }
}
