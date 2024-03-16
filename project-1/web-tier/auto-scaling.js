const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
});

const { getQueueLength } = require("./sqs");
const { getAppTierInstances } = require("./ec2");
const { spawnInstances } = require("./spawn-instances");

const MAX_INSTANCES = 20;
const MAX_CONCURRENT_REQUESTS = 100;
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const adjustInstanceCount = async () => {
  try {
    const queueLength = await getQueueLength();
    console.log(`Queue length: ${queueLength}`);

    if (queueLength > 0) {
      const instances = await getAppTierInstances();
      console.log(`App Tier Instances: ${instances}`);

      if (queueLength >= 50) {
        const required = MAX_INSTANCES - instances;
        if (required > 0) await spawnInstances(required);
      } else if (queueLength > 0) {
        const required = MAX_INSTANCES / 2 - instances;
        if (required > 0) await spawnInstances(required);
      }
    } else {
      console.log("Scaling down to 0 instances");
    }
  } catch (error) {
    console.error("Error adjusting instance count:", error);
  }
};

// Function to get the length of the SQS queue

const pollingInterval = 2000;
setInterval(async () => {
  await adjustInstanceCount();
}, pollingInterval);
