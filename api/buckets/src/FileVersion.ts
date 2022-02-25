/**
 * Provides metadata about a file version
 */
export class FileVersion {
  /**
   * Fully qualified file path
   */
  path : string;

  /**
   * Version ID
   */
  versionId : string;

  /**
   * Date this version was created
   */
  creationDate : Date;

  /**
   * File size
   */
  size : number;
}