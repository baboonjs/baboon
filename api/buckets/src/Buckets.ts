import { ListOptions } from "@baboonjs/api-common";
import { Readable } from "stream";

import { BucketFile } from "./BucketFile";
import { BucketFileList } from "./BucketFileList";
import { BucketFileMetadata } from "./BucketFileMetadata";
import { BucketList } from "./BucketList";
import { BucketWebsiteConfiguration } from "./BucketWebsiteConfiguration";
import { CreateBucketOptions } from "./CreateBucketOptions";
import { DeleteBucketOptions } from "./DeleteBucketOptions";
import { EncryptionSettings } from "./EncryptionSettings";
import { FileVersionList } from "./FileVersionList";
import { GetFileOptions } from "./GetFileOptions";
import { ListFilesOptions } from "./ListFilesOptions";
import { ListFileVersionsOptions } from "./ListFileVersionsOptions";
import { PutFileOptions } from "./PutFileOptions";
import { SetEncryptionOptions } from "./SetEncryptionOptions";
/**
 * Provides methods to manage cloud buckets and stored bojects
 */
export interface Buckets {
  /**
   * List buckets visible to the current user or role
   * @param options @see ListOptions
   */
  listBuckets(options?: ListOptions): Promise<BucketList>;

  /**
   * Create a new bucket.
   * @param bucketName Bucket name
   * @param options @see CreateBucketOptions
   *
   */
  createBucket(
    bucketName: string,
    options?: CreateBucketOptions
  ): Promise<void>;

  /**
   * Delete a bucket
   * @param bucketName Name of the bucket to be deleted
   */
  deleteBucket(
    bucketName: string,
    options?: DeleteBucketOptions
  ): Promise<void>;

  /**
   * Check if a bucket of a given name exists
   * @param bucketName Target bucket name
   */
  bucketExists(bucketName: string): Promise<boolean>;

  /**
   * Get Website configuration associated with a bucket
   * @param bucketName Bucket name
   */
  getWebsiteConfiguration(
    bucketName: string
  ): Promise<BucketWebsiteConfiguration>;

  /**
   * Set Website configuration associated with a bucket
   * @param bucketName Bucket name
   * @param options Website configuration settings
   */
  setWebsiteConfiguration(
    bucketName: string,
    options: BucketWebsiteConfiguration
  ): Promise<BucketWebsiteConfiguration>;

  /**
   * Get the Website URL corresponding to a bucket
   * @param bucketName Bucket name
   */
  getWebsiteDomain(bucketName: string): Promise<string>;

  /**
   * Retrieve resource permission policy associated with a bucket
   * @param bucketName Bucket name
   */
  getPolicy(bucketName: string): Promise<any>;

  /**
   * Set bucket permission policy
   * @param bucketName Bucket name
   * @param policy Object representing bucket permission policy
   */
  setPolicy(bucketName: string, policy: any): Promise<void>;

  /**
   * Delete resource permission policy associated with a bucket
   * @param bucketName Bucket name
   */
  deletePolicy(bucketName: string): Promise<void>;

  /**
   * (Un) Block ACLs/Policies that provide public bucket access
   * @param bucketName Bucket name
   * @param blockAccess If true, any policies/ACLs that enable public access will be blocked
   */
  blockPublicAccess(bucketName: string, blockAccess: boolean): Promise<void>;

  /**
   * Turn on/off versioning of files in a bucket
   * @param bucketName Bucket name
   * @param flag true to turn file versioning on, false to disable it
   */
  setVersioning(bucketName: string, flag: boolean): Promise<void>;

  /**
   * Check if versioning of files is enabled for a bucket
   * @param bucketName Bucket name
   * @returns true if versioning is enabled, false otherwise
   */
  getVersioning(bucketName: string): Promise<boolean>;

  /**
   * Retrieve a paginated list of versions for a file
   * @param bucketName Bucket name
   * @param filePath Fully qualified file path or key
   * @param options @see ListOptions
   */
  listFileVersions(
    bucketName: string,
    options?: ListFileVersionsOptions
  ): Promise<FileVersionList>;

  /**
   * Turn default server side encryption of bucket files on or off
   * @param bucketName Bucket name
   * @param flag true if you want to encrypt files in this bucket by default
   */
  setEncryption(
    bucketName: string,
    flag: boolean,
    options?: SetEncryptionOptions
  ): Promise<void>;

  /**
   * Get encryption configuration for a bucket
   * @param bucketName Bucket name
   * @returns Encryption configuration if it is on, null otherwise
   */
  getEncryption(bucketName: string): Promise<EncryptionSettings>;

  /**
   * List files in a bucket or folder within a bucket
   * @param bucketName Bucket name
   * @param options @see ListFilesOptions
   */
  listFiles(
    bucketName: string,
    options?: ListFilesOptions
  ): Promise<BucketFileList>;

  /**
   * Upload a file to a bucket
   * @param bucketName Bucket name
   * @param filePath File key on the cloud
   * @param file File content
   * @param options Additional settings such as storage class
   */
  putFile(
    bucketName: string,
    filePath: string,
    file: Readable | Buffer,
    options?: PutFileOptions
  ): Promise<void>;

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   * @param options @see GetFileOptions
   */
  getFileAsBuffer(
    bucketName: string,
    filePath: string,
    options?: GetFileOptions
  ): Promise<BucketFile>;

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   * @param options @see GetFileOptions
   */
  getFileAsStream(
    bucketName: string,
    filePath: string,
    options?: GetFileOptions
  ): Promise<Readable>;

  /**
   * Delete a file
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   * @param versionId Version to be deleted
   */
  deleteFile(
    bucketName: string,
    filePath: string,
    versionId?: string
  ): Promise<void>;

  /**
   * Get file metadata
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified path
   */

  getFileMetadata(
    bucketName: string,
    filePath: string
  ): Promise<BucketFileMetadata>;

  /**
   * Delete all files in a bucket or a folder in the bucket
   * @param bucketName Bucket name
   * @param folder Optional folder path
   */
  clean(bucketName: string, folder?: string): Promise<void>;
}
