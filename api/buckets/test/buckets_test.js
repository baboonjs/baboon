'use strict'
const fs = require("fs");
const path = require("path")
const TEST_BUCKET_PREFIX = "baboon-test-bucket-";
const TEXT_FILE_PATH = 'index.html';
const TEST_FOLDER_NAME = 'images';

module.exports = (buckets, provider, publicReadPolicy, region) => {
  let bucket1 = TEST_BUCKET_PREFIX + provider + "-1";
  let bucket2 = TEST_BUCKET_PREFIX + provider + "-2";

  beforeAll(
    async () => { await cleanup(buckets, provider); }
  );

  afterAll(
    async () => { await cleanup(buckets, provider) }
  );

  test("List buckets", async () => {
    expect(await buckets.listBuckets()).toHaveProperty("buckets");
  });

  test("Create bucket", async () => {
    await buckets.createBucket(bucket1);
    let blist = await buckets.listBuckets();
    expect(blist.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: bucket1 })
      ])
    );
  });

  test("Bucket exists", async () => {
    expect(await buckets.bucketExists(bucket1)).toBe(true);
  });

  test("Bucket exists", async () => {
    expect(await buckets.bucketExists("a-random-baboon-bucket-that-should-not-exist")).toBe(false);
  });

  test("Get website domain", async () => {
    expect(await buckets.getWebsiteDomain(bucket1)).toBeTruthy();
  });

  test('Website configuration', async () => {
    await buckets.setWebsiteConfiguration(bucket1, { indexPage: "index.html" });
    let wConfig = await buckets.getWebsiteConfiguration(bucket1);
    expect(wConfig).toEqual(expect.objectContaining({ indexPage: "index.html" }));
  });
  
  test("Block public access", async () => {
    await buckets.blockPublicAccess(bucket1, true);
    publicReadPolicy["Statement"][0]["Resource"] = "arn:aws:s3:::" + bucket1 + "/*";
    await expect( buckets.setPolicy(bucket1, publicReadPolicy)).rejects.toThrow();    
  });

  test("Unblock public access", async () => {
    await buckets.blockPublicAccess(bucket1, false);
    expect(await buckets.setPolicy(bucket1, publicReadPolicy)).toBeUndefined();
  });

  test("Get policy", async () => {
    expect(await buckets.getPolicy(bucket1)).toEqual(publicReadPolicy)
  });

  test("Delete policy", async () => {
    await buckets.deletePolicy(bucket1);
    expect(await buckets.getPolicy(bucket1)).toBeNull();
  });

  test('Upload/download  top level file', async () => {
    let indexFilePath = path.resolve(__dirname, "www", "index.html");
    await buckets.putFile(bucket1, "index.html", fs.readFileSync(indexFilePath));
    let file = await buckets.getFileAsBuffer(bucket1, "index.html");
    expect(file.data.toString()).toBe(fs.readFileSync(indexFilePath).toString());
  });

  test("Get file metadata", async () => {
    expect(await buckets.getFileMetadata(bucket1, "index.html")).toEqual(expect.objectContaining({ path: "index.html"}));
  });

  // Changing versioning after a file has been uploaded to see if versions with
  // null values are deleted
  test("Get/set versioning", async () => {
    await buckets.setVersioning(bucket1, true);
    expect(await buckets.getVersioning(bucket1)).toBeTruthy();
  });

  test("Get/set encryption", async () => {
    await buckets.setEncryption(bucket1, true);
    expect((await buckets.getEncryption(bucket1)).algorithm).toBeTruthy();
  });

  test("Remove encryption", async () => {
    await buckets.setEncryption(bucket1, false);
    expect((await buckets.getEncryption(bucket1))).toBeNull();
  });

  test('Upload/download file in a folder', async () => {
    let imageFilePath = path.resolve(__dirname, "www", "images", "kloud_apps.png");
    await buckets.putFile(bucket1, "images/kloud_apps.png", fs.readFileSync(imageFilePath));
    let fileStream = await buckets.getFileAsStream(bucket1, "images/kloud_apps.png");
    let retBuf = await readableToBuffer(fileStream);
    let fileBuf = fs.readFileSync(imageFilePath);
    expect(retBuf.compare(fileBuf)).toBe(0);
  });
  
  test('List all files', async () => {
    expect(await countAllFiles(buckets, undefined, bucket1)).toBe(2);
  });
  
  test('List top level files', async () => {
    expect(await countTopLevelFiles(buckets, bucket1)).toBe(1);
  });
  
  test('List files in folder', async () => {
    expect(await countAllFiles(buckets, TEST_FOLDER_NAME, bucket1)).toBe(1);
  });
  
  test('Delete file', async () => {
    expect(await deleteFile(buckets, bucket1)).toBe(1);
  });
  
  test("Create bucket in a non-default region", async () => {
    await buckets.createBucket(bucket2, { region: region, access: "public-read"});
    let blist = await buckets.listBuckets();
    expect(blist.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: bucket2 })
      ])
    );
  });

  test('Upload/download file to a bucket in non-default region', async () => {
    let indexFilePath = path.resolve(__dirname, "www", "index.html");
    await buckets.putFile(bucket2, "index.html", fs.readFileSync(indexFilePath));
    let file = await buckets.getFileAsBuffer(bucket2, "index.html");
    expect(file.data.toString()).toBe(fs.readFileSync(indexFilePath).toString());
  });

  test('List all files in a bucket in non-default region', async () => {
    expect(await countAllFiles(buckets, undefined, bucket2)).toBe(1);
  });
 
}

async function cleanup(b, provider) {
  let bucketName = TEST_BUCKET_PREFIX + provider + "-1";
  try {
    await b.clean(bucketName);
    await b.deleteBucket(bucketName);
  } catch (e) {
    if (!(e.name == 'NoSuchBucket')) throw e;
  }

  bucketName = TEST_BUCKET_PREFIX + provider + "-2";
  try {
    await b.clean(bucketName);
    await b.deleteBucket(bucketName);
  } catch (e) {
    if (!(e.name == 'NoSuchBucket')) throw e;
  }
  return true;
}

async function countAllFiles(b, folder, bucketName) {
  let response = await b.listFiles(bucketName, { recursive: true, folder: folder });
  return response.files.length;
}

async function countTopLevelFiles(b, bucketName) {
  let response = await b.listFiles(bucketName);
  return response.files.length;
}

async function deleteFile(b, bucketName) {
  await b.deleteFile(bucketName, TEXT_FILE_PATH);
  return await countAllFiles(b, undefined, bucketName);
}

/*
async function getFile(b, bucketName) {
  let response = await b.getFile(bucketName, TEXT_FILE_PATH);
  return await readableToString(response.Body);
}


function readableToString(readable) {
  return new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', function (chunk) {
      data += chunk;
    });
    readable.on('end', function () {
      resolve(data);
    });
    readable.on('error', function (err) {
      reject(err);
    });
  });
}
*/
function readableToBuffer(readable) {
  return new Promise((resolve, reject) => {
    let bufs = [];
    readable.on('data', function (chunk) {
      bufs.push(chunk);
    });
    readable.on('end', function () {
      resolve(Buffer.concat(bufs));
    });
    readable.on('error', function (err) {
      reject(err);
    });
  });
}
