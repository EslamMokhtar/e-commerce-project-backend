const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const HttpError = require("../models/http-error");

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
});

exports.s3Upload = async (files) => {
  const fileName = uuidv4();
  const params = files.map((file) => {
    return {
      Bucket: process.env.BUCKET_NAME,
      Key: `${fileName}/${crypto.randomBytes(16).toString("hex")}-${
        file.originalname
      }`,
      Body: file.buffer,
    };
  });
  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

exports.emptyBucket = (bucketName, hasProduct, res, edit, callback) => {
  let params = {
    Bucket: bucketName,
    Prefix: `${hasProduct.images.imageFolder}/`,
  };

  s3.listObjects(params, (err, data) => {
    if (err) {
      const error = new HttpError("Can't find object", 404);
      return next(error);
    }

    if (data.Contents.length == 0) {
      const error = new HttpError("Invalid inputs passed!", 422);
      return next(error);
    }

    params = { Bucket: bucketName };
    params.Delete = { Objects: [] };

    data.Contents.forEach(function (content) {
      params.Delete.Objects.push({ Key: content.Key });
    });

    s3.deleteObjects(params, (err, data) => {
      if (err) {
        const error = new HttpError("Can't delete object", 500);
        return next(error);
      }
      if (data.IsTruncated) {
        emptyBucket(bucketName);
      } else {
        if (!edit) {
          return res
            .status(201)
            .json({ message: "Product deleted successfully" });
        }
      }
    });
  });
};
