const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
});

const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

exports.getQueueLength = async () => {
  try {
    const params = {
      QueueUrl: process.env.REQUEST_QUEUE,
      AttributeNames: ["ApproximateNumberOfMessages"],
    };

    const data = await sqs.getQueueAttributes(params).promise();
    return parseInt(data.Attributes.ApproximateNumberOfMessages, 10);
  } catch (error) {
    console.error("Error getting queue length:", error);
    return 0;
  }
};
