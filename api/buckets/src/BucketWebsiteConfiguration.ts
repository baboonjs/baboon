import { BaseResponse } from "@baboonjs/api-common";

/**
 * Website configuration when a bucket is used to store Web pages for a site
 */
export class BucketWebsiteConfiguration extends BaseResponse {
  /**
   * Creates a new <code>BucketWebsiteConfiguration</code> instance
   * @param rawResponse Raw response object from the cloud provider
   */
  constructor(rawResponse: any) {
    super(rawResponse);
  }

  /**
   * Index page, e.g index.html
   */
  indexPage?: string;

  /**
   * Error page to be shown when requested page is not found
   */
  errorPage?: string;

  /**
   * Redirect URL if this bucket redirects requests to another bucket
   * or Website
   */
  redirectHostName?: string;

  /**
   * Redirect protocol, typically https
   */
  redirectProtocol?: string;
}
