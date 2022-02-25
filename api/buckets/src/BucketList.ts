import { ResultList } from "@baboonjs/api-common";
import { Bucket } from "./Bucket";

/**
 * List of buckets returned in response to list or search query
 */
export class BucketList extends ResultList {

  /**
   * List of buckets returned in response to a search or list query
   */
  buckets : Bucket[];
}