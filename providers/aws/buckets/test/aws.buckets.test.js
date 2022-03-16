const BucketsAPITests = require("@baboonjs/api-buckets/test/buckets_test.js");
const { AWSBuckets } = require("../dist/dist-cjs/AWSBuckets");

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

const region = "us-west-2";
BucketsAPITests(new AWSBuckets(), "aws", publicReadPolicy, region); 