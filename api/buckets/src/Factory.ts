import { Buckets } from "./Buckets";
import { CreateBucketsOptions } from "./CreateBucketsOptions";

/**
 * Factory class that creates instances implementing {@link Buckets} interface
 */
export class Factory {
  /**
   * Creates and returns an instance of a class implementing Buckets interface
   * @param provider Cloud provider name. E.g. aws
   * @param options Provider specific options
   * @returns Instance implementing Buckets interface for the specified cloud provider
   */
  static async create(provider : string, options? : CreateBucketsOptions) : Promise<Buckets> {
    const pkg = "@baboonjs/" + provider + "-buckets";
    const { default : BucketsClass } = await import(pkg);
    const buckets : Buckets = new BucketsClass(options);
    return buckets;
  }
}