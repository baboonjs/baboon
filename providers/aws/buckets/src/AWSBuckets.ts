import {
  CreateBucketCommand,
  CreateBucketCommandInput,
  DeleteBucketCommand,
  DeleteBucketEncryptionCommand,
  DeleteBucketPolicyCommand,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetBucketEncryptionCommand,
  GetBucketEncryptionCommandInput,
  GetBucketEncryptionCommandOutput,
  GetBucketLocationCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetBucketVersioningCommandInput,
  GetBucketVersioningCommandOutput,
  GetBucketWebsiteCommand,
  GetBucketWebsiteCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListBucketsCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  ListObjectVersionsCommand,
  ListObjectVersionsCommandInput,
  ListObjectVersionsCommandOutput,
  PutBucketEncryptionCommand,
  PutBucketPolicyCommand,
  PutBucketPolicyCommandInput,
  PutBucketVersioningCommand,
  PutBucketVersioningCommandInput,
  PutBucketWebsiteCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  PutPublicAccessBlockCommand,
  S3Client,
  ServerSideEncryptionRule,
  WebsiteConfiguration,
} from "@aws-sdk/client-s3";
import {
  Bucket,
  BucketFile,
  BucketFileList,
  BucketFileMetadata,
  BucketList,
  Buckets,
  BucketWebsiteConfiguration,
  CreateBucketOptions,
  CreateBucketsOptions,
  DeleteBucketOptions,
  EncryptionSettings,
  FileVersion,
  FileVersionList,
  ListFilesOptions,
  ListFileVersionsOptions,
  PutFileOptions,
  SetEncryptionOptions,
} from "@baboonjs/api-buckets";
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

const PUBLIC_READ_POLICY = `{
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
  protected regionalClients: Map<string, S3Client> = new Map<
    string,
    S3Client
  >();
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
    return this.getClientFromRegion(region);
  }

  private getClientFromRegion(region: string): S3Client {
    let cl = this.regionalClients.get(region);
    if (cl) return cl;
    cl = new S3Client({ region: region });
    this.regionalClients.set(region, cl);
    return cl;
  }

  private async invokeCommand(
    cmd,
    rightClient?,
    connectRetried?
  ): Promise<any> {
    if (!rightClient) rightClient = this.client;
    try {
      return await rightClient.send(cmd);
    } catch (e) {
      if (e.Code == "PermanentRedirect") {
        const cl: S3Client = this.getClientFromEndpoint(e.Endpoint);
        return await this.invokeCommand(cmd, cl);
      } else if (e.$response?.statusCode == 301) {
        const cl: S3Client = this.getClientFromRegion(
          e.$response.headers["x-amz-bucket-region"]
        );
        return await this.invokeCommand(cmd, cl);
      } else if (e.code == "ECONNABORTED" && !connectRetried) {
        return await this.invokeCommand(cmd, rightClient, true);
      } else {
        throw e;
      }
    }
  }

  /**
   * List buckets visible to the current user or role. Note that AWS
   * does not support pagination so start and max options are
   * ignored.
   */
  async listBuckets(/* options?: ListBucketsOptions */): Promise<BucketList> {
    const resp: ListBucketsCommandOutput = await this.invokeCommand(
      new ListBucketsCommand({})
    );
    const bl: BucketList = new BucketList(resp);
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
   * This operation is not atomic if the access is not private
   * @param bucketName Bucket name
   * @param options @see CreateBucketOptions
   *
   */
  async createBucket(
    bucketName: string,
    options?: CreateBucketOptions
  ): Promise<void> {
    if (
      options?.access &&
      options.access != "private" &&
      options.access != "public-read"
    ) {
      throw new Error("Unrecognized access value");
    }
    const input: CreateBucketCommandInput = {
      Bucket: bucketName,
      ObjectOwnership: "BucketOwnerEnforced",
    };
    let region = this.region;
    if (options?.location) region = options.location;
    if (region && region != "us-east-1")
      input.CreateBucketConfiguration = { LocationConstraint: region };
    const command = new CreateBucketCommand(input);
    await this.invokeCommand(command);

    // We block public access by default or if explicitly specified
    if (!options?.access || options?.access == "private") {
      const pubBlockCmd = new PutPublicAccessBlockCommand({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
          IgnorePublicAcls: true,
        },
      });
      await this.invokeCommand(pubBlockCmd);
    } else {
      const policy = PUBLIC_READ_POLICY.replace("__bucketName__", bucketName);
      const pIn: PutBucketPolicyCommandInput = {
        Bucket: bucketName,
        Policy: policy,
      };
      const pCmd = new PutBucketPolicyCommand(pIn);
      await this.invokeCommand(pCmd);
    }
  }

  /**
   * Delete a bucket
   * @param bucketName Name of the bucket to be deleted
   */
  async deleteBucket(
    bucketName: string,
    options?: DeleteBucketOptions
  ): Promise<void> {
    if (options?.force) {
      await this.clean(bucketName);
    }
    const input = { Bucket: bucketName };
    const command = new DeleteBucketCommand(input);
    await this.invokeCommand(command);
  }

  /**
   * Check if a bucket of a given name exists
   * @param bucketName Target bucket name
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.invokeCommand(new HeadBucketCommand({ Bucket: bucketName }));
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
  async getWebsiteConfiguration(
    bucketName: string
  ): Promise<BucketWebsiteConfiguration> {
    const cmd = new GetBucketWebsiteCommand({ Bucket: bucketName });
    const resp: GetBucketWebsiteCommandOutput = await this.invokeCommand(cmd);
    const config = new BucketWebsiteConfiguration(resp);
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
  async setWebsiteConfiguration(
    bucketName: string,
    options: BucketWebsiteConfiguration
  ): Promise<BucketWebsiteConfiguration> {
    const wsConfig: WebsiteConfiguration = {};
    const indexFile = options.indexPage;
    const errorFile = options.errorPage;
    if (indexFile || errorFile) {
      if (indexFile) wsConfig.IndexDocument = { Suffix: indexFile };
      if (errorFile) wsConfig.ErrorDocument = { Key: errorFile };
    } else {
      wsConfig.RedirectAllRequestsTo = {
        HostName: options.redirectHostName,
        Protocol: options.redirectProtocol,
      };
    }
    const input = {
      Bucket: bucketName,
      WebsiteConfiguration: wsConfig,
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
    const resp = await this.invokeCommand(cmd);
    const region = resp.LocationConstraint
      ? resp.LocationConstraint
      : "us-east-1";
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

    try {
      const awsResp = await this.invokeCommand(command);
      if (awsResp.Policy) return JSON.parse(awsResp.Policy);
      return null;
    } catch (e) {
      if (e.Code == "NoSuchBucketPolicy") return null;
      throw e;
    }
  }

  /**
   * Set bucket permission policy
   * @param bucketName Bucket name
   * @param policy Object representing bucket permission policy
   */
  async setPolicy(bucketName: string, policy: any): Promise<void> {
    const input = { Bucket: bucketName, Policy: JSON.stringify(policy) };
    const command = new PutBucketPolicyCommand(input);
    await this.invokeCommand(command);
  }

  /**
   * Delete resource permission policy associated with a bucket
   * @param bucketName Bucket name
   */
  async deletePolicy(bucketName: string): Promise<void> {
    const input = { Bucket: bucketName };
    const command = new DeleteBucketPolicyCommand(input);
    await this.invokeCommand(command);
  }

  /**
   * Block or unblock public access
   * @param bucketName Bucket name
   * @param blockAccess true if you want to block public access, false otherwise
   */
  async blockPublicAccess(
    bucketName: string,
    blockAccess: boolean
  ): Promise<void> {
    const pubBlockCmd = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: blockAccess,
        BlockPublicPolicy: blockAccess,
        RestrictPublicBuckets: blockAccess,
        IgnorePublicAcls: blockAccess,
      },
    });
    await this.invokeCommand(pubBlockCmd);
  }

  /**
   * Turn on/off versioning of files in a bucket
   * @param bucketName Bucket name
   * @param flag true to turn file versioning on, false to disable it
   */
  async setVersioning(bucketName: string, flag: boolean): Promise<void> {
    const input: PutBucketVersioningCommandInput = {
      Bucket: bucketName,
      VersioningConfiguration: { Status: flag ? "Enabled" : "Suspended" },
    };
    await this.invokeCommand(new PutBucketVersioningCommand(input));
  }

  /**
   * Check if versioning of files is enabled for a bucket
   * @param bucketName Bucket name
   * @returns true if versioning is enabled, false otherwise
   */
  async getVersioning(bucketName: string): Promise<boolean> {
    const input: GetBucketVersioningCommandInput = { Bucket: bucketName };
    const resp: GetBucketVersioningCommandOutput = await this.invokeCommand(
      new GetBucketVersioningCommand(input)
    );
    if (resp && resp.Status == "Enabled") return true;
    return false;
  }

  /**
   * Retrieve a paginated list of versions for a file
   * @param bucketName Bucket name
   * @param filePath Fully qualified file path or key
   * @param options @see ListFileVersionsOptions
   */
  async listFileVersions(
    bucketName: string,
    options?: ListFileVersionsOptions
  ): Promise<FileVersionList> {
    const input: ListObjectVersionsCommandInput = {
      Bucket: bucketName,
      MaxKeys: options?.maxItems ? options.maxItems : undefined,
      Prefix: options?.filePath ? options.filePath : undefined,
      KeyMarker: options?.start ? options.start : undefined,
    };
    const resp: ListObjectVersionsCommandOutput = await this.invokeCommand(
      new ListObjectVersionsCommand(input)
    );
    const fvList: FileVersionList = new FileVersionList(resp);
    fvList.next = resp.NextKeyMarker;
    const versions = [];
    fvList.versions = versions;
    for (const v of resp.Versions) {
      const fv = new FileVersion();
      fv.creationDate = v.LastModified;
      fv.path = v.Key;
      fv.size = v.Size;
      fv.versionId = v.VersionId;
      fv.isLatest = v.IsLatest;
      versions.push(fv);
    }
    return fvList;
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
  async setEncryption(
    bucketName: string,
    flag: boolean,
    options?: SetEncryptionOptions
  ): Promise<void> {
    if (flag) {
      // Turn encryption on
      let input;
      if (!options || !options?.algorithm || options?.algorithm == "AES256") {
        input = {
          Bucket: bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
              },
            ],
          },
        };
      } else if (options.algorithm == "aws:kms") {
        input = {
          Bucket: bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: "aws:kms",
                  KMSMasterKeyID: options.keyId,
                },
                BucketKeyEnabled: options.providerOptions?.disableBucketKey
                  ? false
                  : true,
              },
            ],
          },
        };
      }
      const command = new PutBucketEncryptionCommand(input);
      await this.invokeCommand(command);
    } else {
      // Remove default encryption if present
      try {
        const command = new DeleteBucketEncryptionCommand({
          Bucket: bucketName,
        });
        await this.invokeCommand(command);
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   * Get encryption configuration for a bucket
   * @param bucketName Bucket name
   * @returns Encryption configuration if it is on, null otherwise
   */
  async getEncryption(bucketName: string): Promise<EncryptionSettings> {
    try {
      const input: GetBucketEncryptionCommandInput = {
        Bucket: bucketName,
      };
      const resp: GetBucketEncryptionCommandOutput = await this.invokeCommand(
        new GetBucketEncryptionCommand(input)
      );
      const rules: ServerSideEncryptionRule[] =
        resp?.ServerSideEncryptionConfiguration?.Rules;
      if (!rules) return null;
      // We need to check if we can get back more than one rules. For now, the assumption is
      // that we only have one
      const rule: ServerSideEncryptionRule = rules[0];
      const output: EncryptionSettings = new EncryptionSettings(resp);
      output.algorithm = rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      output.keyId = rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID;
      return output;
    } catch (e) {
      if (e.Code == "ServerSideEncryptionConfigurationNotFoundError")
        return null;
      throw e;
    }
  }

  /**
   * List files in a bucket or folder within a bucket
   * @param bucketName Bucket name
   * @param options @see ListFilesOptions
   */
  async listFiles(
    bucketName: string,
    options?: ListFilesOptions
  ): Promise<BucketFileList> {
    const input: ListObjectsV2CommandInput = { Bucket: bucketName };
    if (options?.start) input.ContinuationToken = options.start;
    if (options?.maxItems) input.MaxKeys = options.maxItems;
    if (!options?.recursive) input.Delimiter = "/";

    let path = options?.folder;
    if (path) {
      if (path[0] == "/") path = path.substring(1);
      input.Prefix = path;
      if (!input.Prefix.endsWith("/")) input.Prefix = input.Prefix + "/";
    }
    const r: ListObjectsV2CommandOutput = await this.invokeCommand(
      new ListObjectsV2Command(input)
    );
    const flist: BucketFileList = new BucketFileList(r);
    flist.next = r.NextContinuationToken;
    flist.files = [];
    if (r.Contents) {
      for (const f of r.Contents) {
        const bf = new BucketFile(undefined);
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
    await this.invokeCommand(command);
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
  async putFile(
    bucketName: string,
    filePath: string,
    file: Readable | Buffer,
    options?: PutFileOptions
  ): Promise<void> {
    const input: PutObjectCommandInput = { Bucket: bucketName, Key: filePath };
    if (options?.access) input.ACL = options.access;
    input.Body = file;
    if (options?.contentType) input.ContentType = options.contentType;
    if (options?.storageClass) input.StorageClass = options.storageClass;
    if (options?.redirect) input.WebsiteRedirectLocation = options.redirect;
    const command = new PutObjectCommand(input);
    await this.invokeCommand(command);
  }

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */
  async getFileAsBuffer(
    bucketName: string,
    filePath: string
  ): Promise<BucketFile> {
    const response: GetObjectCommandOutput = await this.getFileHelper(
      bucketName,
      filePath
    );
    const f = new BucketFile(null);
    f.size = response.ContentLength;
    f.contentType = response.ContentType;

    if (response.Body instanceof Readable) {
      const d: Readable = response.Body;
      f.data = await readableToBuffer(d);
    } else if (response.Body instanceof ReadableStream) {
      const rs: ReadableStream = response.Body;
      f.data = await readableStreamToBuffer(rs);
    } else {
      // Assume the type is Blob
      const str: NodeJS.ReadableStream = await response.Body.stream();
      f.data = await buffer(str);
    }
    return f;
  }

  /**
   * Download file contents
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */
  async getFileAsStream(
    bucketName: string,
    filePath: string
  ): Promise<Readable> {
    const response: GetObjectCommandOutput = await this.getFileHelper(
      bucketName,
      filePath
    );
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
   * @param versionId Version to be deleted
   */
  async deleteFile(
    bucketName: string,
    filePath: string,
    versionId?: string
  ): Promise<void> {
    const input: DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: filePath,
      VersionId: versionId,
    };
    const command = new DeleteObjectCommand(input);
    await this.invokeCommand(command);
  }

  /**
   * Get file metadata
   * @param bucketName Bucket name
   * @param filePath File key or fully qualified name
   */

  async getFileMetadata(
    bucketName: string,
    filePath: string
  ): Promise<BucketFileMetadata> {
    const awsResp = await this.invokeCommand(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      })
    );
    const resp = new BucketFileMetadata(awsResp);
    resp.contentEncoding = awsResp.ContentEncoding;
    resp.contentType = awsResp.ContentType;
    resp.expires = awsResp.Expires;
    resp.lastModified = awsResp.LastModified;
    resp.path = filePath;
    resp.size = awsResp.ContentLength;
    resp.storageClass = awsResp.StorageClass;
    return resp;
  }

  /**
   * Delete all files in a bucket or a folder in the bucket
   * @param bucketName Bucket name
   * @param folder Optional folder or full file path
   */
  async clean(bucketName: string, folder?: string): Promise<void> {
    let files: BucketFileList = await this.listFiles(bucketName, {
      folder: folder,
    });
    while (files?.files && files.files.length > 0) {
      for (const f of files.files) {
        await this.deleteFile(bucketName, f.path);
      }
      files = await this.listFiles(bucketName, { folder: folder });
    }

    // Check if there are any file versions that need deletion
    const input: ListObjectVersionsCommandInput = {
      Bucket: bucketName,
      Prefix: folder,
    };
    let resp: ListObjectVersionsCommandOutput = await this.invokeCommand(
      new ListObjectVersionsCommand(input)
    );
    while (
      (resp.Versions && resp.Versions.length > 0) ||
      (resp.DeleteMarkers && resp.DeleteMarkers.length > 0)
    ) {
      if (resp.Versions) {
        for (const v of resp.Versions) {
          this.deleteFile(bucketName, v.Key, v.VersionId);
        }
      }

      if (resp.DeleteMarkers) {
        for (const v of resp.DeleteMarkers) {
          this.deleteFile(bucketName, v.Key, v.VersionId);
        }
      }
      resp = await this.invokeCommand(new ListObjectVersionsCommand(input));
    }
  }

  private async getFileHelper(
    bucketName: string,
    filePath: string
  ): Promise<GetObjectCommandOutput> {
    const input = { Bucket: bucketName, Key: filePath };
    const command = new GetObjectCommand(input);
    return await this.invokeCommand(command);
  }
}

async function readableToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
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
