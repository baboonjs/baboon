const fs = require("fs");
const { AWSBuckets } = require("..");

const publicReadPolicy = {
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
}
async function main() {
  let bucketName = "nabh-test-" + new Date().getTime();
  let bucketName2 = bucketName + "2";
  let b = new AWSBuckets();
  b.deleteBucket("nabh-test-1646443360913", { force: true});
  //b.clean("baboon-test-bucket-aws-1");
  /*
  console.log("createBucket");
  await b.createBucket(bucketName);
  await b.createBucket(bucketName2);
  
  console.log("listBuckets");
  let result = await b.listBuckets();
  console.log(JSON.stringify(result, null, 2));

  console.log("blockPublicAccess");
  await b.blockPublicAccess(bucketName, true);

  console.log("bucketExists");
  await b.bucketExists(bucketName);

  console.log("deleteBucket");
  await b.deleteBucket(bucketName2);

  console.log("setVersioning");
  await b.setVersioning(bucketName, true);

  console.log("putFile");
  await b.putFile(bucketName, "test.html", fs.readFileSync("test.html"));
  await b.putFile(bucketName, "test.html", fs.readFileSync("test2.html"));
  await b.putFile(bucketName, "test2.html", fs.readFileSync("test2.html"));

  console.log("listFiles");
  result = await b.listFiles(bucketName);
  console.log(JSON.stringify(result, null, 2));

  console.log("listFileVersions");
  result = await b.listFileVersions(bucketName, "test.html");
  console.log(JSON.stringify(result, null, 2));

  publicReadPolicy["Statement"][0]["Resource"] = "arn:aws:s3:::" + bucketName + "/*";
  console.log("blockPublicAccess");
  await b.blockPublicAccess(bucketName, false);
  console.log("setPolicy");
  // await b.setPolicy(bucketName, publicReadPolicy);
  console.log("getPolicy");
  result =   await b.getPolicy(bucketName);
  console.log("deletePolicy");
  await b.deletePolicy(bucketName);

  console.log("deleteFile");
  await b.deleteFile(bucketName, "test2.html");
  console.log("setEncryption");
  await b.setEncryption(bucketName, true);
  console.log("getEncryption");
  await b.getEncryption(bucketName);
  console.log("getFileAsBuffer");
  await b.getFileAsBuffer(bucketName, "test.html");
  console.log("getFileAsStream");
  await b.getFileAsStream(bucketName, "test.html");
  console.log("getFileMetadata");
  result = await b.getFileMetadata(bucketName, "test.html");
  console.log("getVersioning");
  await b.getVersioning(bucketName);
  console.log("setWebsiteConfiguration");
  await b.setWebsiteConfiguration(bucketName, { indexPage: "index.html"});
  console.log("getWebsiteConfiguration");
  await b.getWebsiteConfiguration(bucketName);
  console.log("getWebsiteDomain");
  await b.getWebsiteDomain(bucketName);

*/
}
main();