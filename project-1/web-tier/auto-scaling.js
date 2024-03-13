const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
});

const MAX_INSTANCES = 20;
const MAX_CONCURRENT_REQUESTS = 100;
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const adjustInstanceCount = async () => {
  try {
    const queueLength = await getQueueLength();
    console.log(`Queue length: ${queueLength}`);

    // Adjust the instance count based on the queue length
    if (queueLength >= MAX_CONCURRENT_REQUESTS) {
      // Scale up to the maximum number of instances
      console.log(`Scaling up to ${MAX_INSTANCES} instances`);
      // Implement logic to spawn instances (not provided here)
    } else if (queueLength > 0) {
      // Calculate the desired number of instances based on the queue length
      const desiredInstances = Math.ceil(
        queueLength / (MAX_CONCURRENT_REQUESTS / MAX_INSTANCES)
      );
      console.log(
        `Desired instances based on queue length: ${desiredInstances}`
      );
      // Implement logic to adjust the number of instances (spawn/terminate instances) accordingly
      // For example, compare the desired instances with the current number of instances and spawn/terminate instances accordingly
    } else {
      // No requests in the queue, scale down to 0 instances
      console.log("Scaling down to 0 instances");
      // Implement logic to terminate instances (not provided here)
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
