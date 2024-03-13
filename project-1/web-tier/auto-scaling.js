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

const adjustInstanceCount = async () => {
  try {
    const queueLength = await getQueueLength();
    console.log(`Queue length: ${queueLength}`);

    // Adjust the instance count based on the queue length
    if (queueLength >= 70) {
      // Scale up to 20 instances
      console.log("Scaling up to 20 instances");
      // Implement logic to spawn instances (not provided here)
    } else if (queueLength >= 5) {
      // Scale down to 1 instance
      console.log("Scaling down to 1 instance");
      // Implement logic to terminate instances (not provided here)
    } else if (queueLength <= 0) {
      onsole.log("Scaling down to 1 instance");
    }
  } catch (error) {
    console.error("Error adjusting instance count:", error);
  }
};

// Function to get the length of the SQS queue
const getQueueLength = async () => {
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

const pollingInterval = 2000;
setInterval(async () => {
  await adjustInstanceCount();
}, pollingInterval);
