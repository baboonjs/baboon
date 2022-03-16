/**
 * Base class for options that allows passing of provider-specific
 * options.
 */
export class BaseOptions {
  /**
   * Provider-specific options
   */
  providerOptions?: any;

  /**
   * Creates <code>BaseOptions</code> instance with given provider options
   * @param options Provider specific options
   */
  constructor(options: any) {
    this.providerOptions = options;
  }
}
