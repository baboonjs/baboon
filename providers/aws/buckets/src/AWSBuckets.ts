import {
  CreateBucketCommand, CreateBucketCommandInput, DeleteBucketCommand,
  DeleteBucketEncryptionCommand, DeleteBucketPolicyCommand, DeleteObjectCommand,
  GetBucketLocationCommand, GetBucketPolicyCommand, GetBucketWebsiteCommand,
  GetBucketWebsiteCommandOutput, GetObjectCommand, GetObjectCommandOutput,
  HeadBucketCommand, HeadObjectCommand, ListBucketsCommand,
  ListBucketsCommandOutput, ListObjectsV2Command, ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput, PutBucketEncryptionCommand, PutBucketPolicyCommand,
  PutBucketPolicyCommandInput, PutBucketWebsiteCommand, PutObjectCommand,
  PutObjectCommandInput, S3Client, WebsiteConfiguration
} from "@aws-sdk/client-s3";
import {
  Bucket, BucketFile, BucketFileList, BucketFileMetadata, BucketList,
  Buckets, BucketWebsiteConfiguration, CreateBucketOptions, CreateBucketsOptions,
  FileVersionList,
  ListFilesOptions, PutFileOptions, SetEncryptionOptions
} from "@baboonjs/api-buckets";
import { ListOptions } from "@baboonjs/api-common";
import { Readable } from "stream";
import { buffer } from "stream/consumers";

const DASH_REGIONS = {
  "us-east-1": true,
  "us-west-1": true,
  "us-west-2": true,
  "ap-southeast-1": true,
  "ap-southeast-2": true,
  "ap-northeast-1": true,

};

const PUBLIC_READ_POLICY =
  `{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"PublicRead",
      "Effect":"Allow",
      "Principal": "*",
      "Action":["s3:GetObject","s3:GetObjectVersion"],
      "Resource":["arn:aws:s3:::__bucketName__/*"]
    }
  ]
}`;
/*
const AUTHENTICATED_USER_READ_POLICY =
  `{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"AuthenticatedRead",
      "Effect":"Allow",
      "Principal": {"AWS": "*"},
      "Action":["s3:GetObject","s3:GetObjectVersion"],
      "Resource":["arn:aws:s3:::__bucketName__/*"]
    }
  ]
}`


const CLOUDFRONT_OAI_POLICY =
  `{
  "Version": "2012-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
      {
          "Effect": "Allow",
          "Principal": {
              "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity __OAI_ID__"
          },
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::__bucketName__/*"
      }
  ]
}`
*/
/**
 * Implementation of {@link Buckets} interface for AWS
 */
export class AWSBuckets implements Buckets {
  protected client: S3Client;
  protected regionalClients: Map<string, S3Client> = new Map<string, S3Client>();
  protected region: string;
  constructor(options: CreateBucketsOptions) {
    this.region = options?.region ? options.region : "us-east-1";
    const input = { region: this.region, useArnRegion: true, maxAttempts: 3 };
    this.client = new S3Client(input);
    this.regionalClients.set(this.region, this.client);
  }

  private getClientFromEndpoint(ep: string): S3Client {
    let region = ep.substring(0, ep.length - ".amazonaws.com".length);
    region = region.substring(region.lastIndexOf(".") + 1);
    let cl = this.regionalClients.get(region);
    if (cl) return cl;
    cl = new S3Client({ region: region });
    this.regionalClients.set(region, cl);
    return cl;
  }

  private async invokeCommand(cmd): Promise<any> {
    try {
      return await this.client.send(cmd);
    } catch (e) {
      if (e.Code == "PermanentRedirect") {
        const cl: S3Client = this.getClientFromEndpoint(e.Endpoint);
        return await cl.send(cmd);
      } else {
        throw e;
      }
    }
  }

  /**
   * List buckets visible to the current user or role. Note that AWS
   * does not support pagination so offset and limit options are 
   * ignored.
   * @param options @see ListBucketsOptions
   */
  async listBuckets(/* options?: ListBucketsOptions */): Promise<BucketList> {
    const resp: ListBucketsCommandOutput = await this.client.send(new ListBucketsCommand({}));
    const bl: BucketList = new BucketList();
    bl.buckets = [];
    if (resp.Buckets) {
      for (const b of resp.Buckets) {
        const newb = new Bucket();
        newb.creationDate = b.CreationDate;
        newb.name = b.Name;
        bl.buckets.push(newb);
      }
    }
    return bl;
  }

  /**
   * Create a new bucket
   * @remarks
   * This operation is not atomic if object ownership is bucket-owner-enforced
   * and access is something other than private. Might want to revert bucket creation
   * if setting the policy fails
   * @param bucketName Bucket name
   * @param options @see CreateBucketOptions
   * 
   */
  async createBucket(bucketName: string,
    options?: CreateBucketOptions): Promise<void> {
    // ACL values - "authenticated-read" | "private" | "public-read" | "public-read-write"
    const input: CreateBucketCommandInput = { Bucket: bucketName, ObjectOwnership: "bucket-owner-enforced" };
    let policy: string = null;
    if (options?.access && options.access != "private") {
      if (options.access == "public-read") policy = PUBLIC_READ_POLICY;
      else throw new Error("Unrecognized access string.");
      policy = policy.replace("__bucketName__", bucketName);
    }

    const command = new CreateBucketCommand(input);
    await this.client.send(command);
    if (policy) {
      const pIn: PutBucketPolicyCommandInput = {
        Bucket: bucketName,
        Policy: policy
      };
      const pCmd = new PutBucketPolicyCommand(pIn);
      await this.client.send(pCmd);
    }

  }

  /**
   * Delete a bucket
   * @param bucketName Name of the bucket to be deleted
   */
  async deleteBucket(bucketName: string): Promise<void> {
    const input = { Bucket: bucketName };
    const command = new DeleteBucketCommand(input);
    await this.client.send(command);
  }

  /**
   * Check if a bucket of a given name exists
   * @param bucketName Target bucket name
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (e) {
      if (e.name == "NotFound") return false;
      else throw e;
    }
  }

  /**
   * Get Website configuration associated with a bucket
   * @param bucketName Bucket name
   */
  async getWebsiteConfiguration(bucketName: string)
    : Promise<BucketWebsiteConfiguration> {
    const cmd = new GetBucketWebsiteCommand({ Bucket: bucketName });
    const resp: GetBucketWebsiteCommandOutput = await this.invokeCommand(cmd);
    const config = new BucketWebsiteConfiguration();
    config.errorPage = resp.ErrorDocument?.Key;
    config.indexPage = resp.IndexDocument?.Suffix;
    config.redirectHostName = resp.RedirectAllRequestsTo?.HostName;
    config.redirectProtocol = resp.RedirectAllRequestsTo?.Protocol;
    return config;
  }

  /**
   * Set Website configuration associated with a bucket
   * @param bucketName Bucket name
   * @param options Website configuration settings
   */
  async setWebsiteConfiguration(bucketName: string,
    options: BucketWebsiteConfiguration): Promise<BucketWebsiteConfiguration> {
    const wsConfig: WebsiteConfiguration = {};
    const indexFile = options.indexPage;
    const errorFile = options.errorPage;
    if (indexFile || errorFile) {
      if (indexFile) wsConfig.IndexDocument = { Suffix: indexFile };
      if (errorFile) wsConfig.ErrorDocument = { Key: errorFile };
    } else {
      wsConfig.RedirectAllRequestsTo = { HostName: options.redirectHostName, Protocol: options.redirectProtocol };
    }
    const input = {
      Bucket: bucketName,
      WebsiteConfiguration: wsConfig
    };
    const command = new PutBucketWebsiteCommand(input);
    await this.invokeCommand(command);
    return options;
  }

  /**
   * Get the Website URL corresponding to a bucket
   * @param bucketName Bucket name
   */
  async getWebsiteDomain(bucketName: string): Promise<string> {
    const cmd = new GetBucketLocationCommand({ Bucket: bucketName });
    const resp = await this.client.send(cmd);
    const region = resp.LocationConstraint ? resp.LocationConstraint : "us-east-1";
    if (DASH_REGIONS[region]) {
      return bucketName + ".s3-website-" + this.region + ".amazonaws.com";
    } else {
      return bucketName + ".s3-website." + this.region + ".amazonaws.com";
    }
  }

  /**
   * Retrieve resource permission policy associated with a bucket
   * @param bucketName Bucket name
   */
  async getPolicy(bucketName: string): Promise<any> {
    const input = { Bucket: bucketName };
    const command = new GetBucketPolicyCommand(input);
    const awsResp = await this.client.send(command);
    if (awsResp.Policy) return JSON.parse(awsResp.Policy);
    return null;
  }

  /**
   * Set bucket permission policy
   * @param bucketName Bucket name
   * @param policy Object representing bucket permission policy
   */
  async setPolicy(bucketName: string, policy: any): Promise<void> {
    const input = { Bucket: bucketName, Policy: JSON.stringify(policy) };
    const command = new PutBucketPolicyCommand(input);
    await this.client.send(command);

  }

  /**
   * Delete resource permission policy associated with a bucket
   * @param bucketName Bucket name
   */
  async deletePolicy(bucketName: string): Promise<void> {
    const input = { Bucket: bucketName };
    const command = new DeleteBucketPolicyCommand(input);
    await this.client.send(command);

  }

  /**
   * Turn on/off versioning of files in a bucket
   * @param bucketName Bucket name
   * @param flag true to turn file versioning on, false to disable it
   */
  async setVersioning(bucketName: string, flag: boolean): Promise<void> {

  }

  /**
   * Check if versioning of files is enabled for a bucket
   * @param bucketName Bucket name
   * @returns true if versioning is enabled, false otherwise
   */
  async getVersioning(bucketName: string): Promise<boolean> {
    return false;
  }

  /**
   * Retrieve a paginated list of versions for a file
   * @param bucketName Bucket name
   * @param filePath Fully qualified file path or key
   * @param options @see ListOptions
   */
  async listFileVersions(bucketName: string, filePath: string,
    options?: ListOptions): Promise<FileVersionList> {
    return null;
  }

  /**
   * Turn default server side encryption of bucket files on or off.
   * @remarks
   * 
   * There are two options for encrypting bucket objects on the server side. Clients
   * can either use a S3-managed key or a KMS key. For the first option, call this 
   * method without the <code>options</code> argument. or call it with 
   * <code>options.algorithm</code> set to "AES256". 
   * 
   * Alternatively you can specify a KMS-managed key for encryption. You can do so
   * by setting <code>options.algorithm</code> to "aws:kms" and optionally specifying
   * your own key ID/ARN via <code>options.keyId</code>. If no key is specified, AWS
   * will auto-generate a KMS key.
   * 
   * In case of KMS-managed key, this method sets the <code>BucketKeyEnabled</code>
   * passed on to AWS to <code>true</code>. You can override this by specifying 
   * <code>options.disableBucketKey</code> to <code>true</code>.
   * 
   * @param bucketName Bucket name
   * @param flag true if you want to encrypt files in this bucket by default
   * @param options Options that allow specification of KMS key, encryption algo, etc.
   */
  async setEncryption(bucketName: string, flag: boolean, options?: SetEncryptionOptions): Promise<void> {

    if (flag) {
      // Turn encryption on
      let input;
      if (!options || options?.algorithm == "AES256") {
        input = {
          Bucket: bucketName, ServerSideEncryptionConfiguration: {
            Rules: [
              { ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }
            ]
          }
        };
      } else if (options.algorithm == "aws:kms") {
        input = {
          Bucket: bucketName, ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "aws:kms", KMSMasterKeyID: options.keyId },
                BucketKeyEnabled: options.providerOptions?.disableBucketKey ? false : true
              }
            ]
          }
        };
      }
      const command = new PutBucketEncryptionCommand(input);
      await this.client.send(command);
    } else {
      // Remove default encryption if present
      const command = new DeleteBucketEncryptionCommand({ Bucket: bucketName });
      await this.client.send(command);
    }
  }

  /**
   * Get encryption configuration for a bucket
   * @param bucketName Bucket name
   * @returns Encryption configuration if it is on, null otherwise
   */
  async getEncryption(bucketName: string): Promise<SetEncryptionOptions> {
    return null;
  }

  /**
   * List files in a bucket or folder within a bucket
   * @param bucketName Bucket name
   * @param options @see ListFilesOptions
   */
  async listFiles(bucketName: string, options?: ListFilesOptions)
    : Promise<BucketFileList> {
    const input: ListObjectsV2CommandInput = { Bucket: bucketName };
    if (options?.offset) input.ContinuationToken = options.offset;
    if (options?.limit) input.MaxKeys = options.limit;
    if (!options?.recursive) input.Delimiter = "/";

    let path = options?.folder;
    if (path) {
      if (path[0] == "/") path = path.substring(1);
      input.Prefix = path;
      if (!input.Prefix.endsWith("/")) input.Prefix = input.Prefix + "/";
    }
    const r: ListObjectsV2CommandOutput =
      await this.client.send(new ListObjectsV2Command(input));
    const flist: BucketFileList = new BucketFileList();
    flist.next = r.ContinuationToken;
    flist.files = [];
    if (r.Contents) {
      for (const f of r.Contents) {
        const bf = new BucketFile();
        bf.path = f.Key;
        bf.size = f.Size;
        bf.lastModified = f.LastModified;
        bf.storageClass = f.StorageClass;
        flist.files.push(bf);
      }
    }

    if (r.CommonPrefixes) {
      const folders = [];
      for (const p of r.CommonPrefixes) {
        folders.push(p.Prefix);
      }
      flist.folders = folders;
    }

    return flist;
  }

  /*
   * 
   * @param bucketName Bucket name
   * @param folderPath Slash seperated folder path
   * @param options @see PutFileOptions
  async createFolder(bucketName: string, folderPath: string, options?: PutFileOptions): Promise<void> {
    var input = { Bucket: bucketName, Key: folderPath, ContentLength: 0 };
    if (options?.access) options.access;
    if (!folderPath.endsWith('/')) folderPath = folderPath + '/';
    // You DO NOT want a top level folder with "" as its name
    if (folderPath.startsWith('/')) folderPath = folderPath.substring(1);

    const command = new PutObjectCommand(input);
    await this.client.send(command);
  }
   */

  /**
   * Upload a file to a bucket
   * @remarks
   * AWS Storage classes: STANDARD | REDUCED_REDUNDANCY | STANDARD_IA | 
   * ONEZONE_IA | INTELLIGENT_TIERING | GLACIER | DEEP_ARCHIVE | OUTPOSTS | GLACIER_IR

   * @param bucketName Bucket name
   * @param filePath File key on the cloud
   * @param file File content
   * @param options Additional settings such as storage class
   */
  async putFile(bucketName: string, filePath: string,
    file: Readable | Buffer, options?: PutFileOptions): Promise<void> {
    const input: PutObjectCommandInput = { Bucket: bucketName, Key: filePath };
    if (options?.access) input.ACL = options.access;
    input.Body = file;
    if (options?.contentType) input.ContentType = options.contentType;
    if (options?.storageClass) input.StorageClass = options.storageClass;
    if (options?.redirect) input.WebsiteRedirectLocation = options.redirect;
    const command = new PutObjectCommand(input);
    await this.client.send(command);

  }

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */
  async getFileAsBuffer(bucketName: string, filePath: string): Promise<BucketFile> {
    const response: GetObjectCommandOutput = await getFileHelper(bucketName, filePath);
    const f = new BucketFile();
    f.size = response.ContentLength;
    f.contentType = response.ContentType;
    if (response.Body instanceof Blob) {
      const str: NodeJS.ReadableStream = await response.Body.stream();
      f.data = await buffer(str);
    } else if (response.Body instanceof Readable) {
      const d: Readable = response.Body;
      f.data = await readableToBuffer(d);
    } else {
      const rs: ReadableStream = response.Body;
      f.data = await readableStreamToBuffer(rs);
    }
    return f;
  }

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */
  async getFileAsStream(bucketName: string, filePath: string): Promise<Readable> {
    const response: GetObjectCommandOutput = await getFileHelper(bucketName, filePath);
    if (response.Body instanceof Readable) return response.Body;
    if (response.Body instanceof ReadableStream) {
      return Readable.from(await readableStreamToBuffer(response.Body));
    } else if (response.Body instanceof Blob) {
      return Readable.from(response.Body.stream());
    }
  }

  /**
   * Delete a file
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */
  async deleteFile(bucketName: string, filePath: string): Promise<void> {
    const input = { Bucket: bucketName, Key: filePath };
    const command = new DeleteObjectCommand(input);
    await this.client.send(command);

  }


  /**
   * Get file metadata
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */

  async getFileMetadata(bucketName: string, filePath: string): Promise<BucketFileMetadata> {
    try {
      const awsResp = await this.client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: filePath
      }));
      const resp = new BucketFileMetadata();
      resp.contentEncoding = awsResp.ContentEncoding;
      resp.contentType = awsResp.ContentType;
      resp.expires = awsResp.Expires;
      resp.lastModified = awsResp.LastModified;
      resp.path = filePath;
      resp.size = awsResp.ContentLength;
      resp.storageClass = awsResp.StorageClass;
      return resp;
    } catch (e) {
      if (e.name == "NotFound") return null;
      else throw e;
    }
  }
}

async function getFileHelper(bucketName: string, filePath: string):
  Promise<GetObjectCommandOutput> {
  const input = { Bucket: bucketName, Key: filePath };
  const command = new GetObjectCommand(input);
  return await this.client.send(command);

}

async function readableToBuffer(stream: Readable): Promise<Buffer> {

  return new Promise<Buffer>((resolve, reject) => {

    const _buf = Array<any>();

    stream.on("data", chunk => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", err => reject(`error converting stream - ${err}`));

  });
}

async function readableStreamToBuffer(rs: ReadableStream): Promise<Buffer> {
  const reader = rs.getReader();
  let done = false;
  const _buf = Array<any>();
  while (!done) {
    const chunk = await reader.read();
    if (chunk.value) _buf.push(chunk.value);
    done = chunk.done;
  }
  return Buffer.concat(_buf);
}
