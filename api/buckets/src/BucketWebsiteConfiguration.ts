/**
 * Website configuration when a bucket is used to store Web pages for a site
 */
export class BucketWebsiteConfiguration {
  /**
   * Index page, e.g index.html
   */
  indexPage? : string;

  /**
   * Error page to be shown when requested page is not found
   */
  errorPage? : string;

  /**
   * Redirect URL if this bucket redirects requests to another bucket
   * or Website
   */
  redirectHostName? : string;

  /**
   * Redirect protocol, typically https
   */
  redirectProtocol? : string;
}