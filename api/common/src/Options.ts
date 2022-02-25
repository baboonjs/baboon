
/**
 * Base class for options that allows passing of provider-specific 
 * options.
 */
export class Options {
  /**
   * Provider-specific options
   */
  providerOptions?;

  /**
   * Creates <code>Options</code> instance with given provider options
   * @param options Provider specific options
   */
  constructor(options) {
    this.providerOptions = options;
  }
}