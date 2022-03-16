module.exports = class BaboonFactory {
  static create(opts, moduleName) {
    if (moduleName == "buckets") {
      let b = require("@baboonjs/aws-buckets");
      return new b["AWSBuckets"]();
    }
  }
};