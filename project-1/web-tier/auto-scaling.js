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
const {
  getAppTierInstances,
  terminateInstances,
  spawnInstances,
} = require("./ec2");

const MAX_INSTANCES = 20;
const MAX_CONCURRENT_REQUESTS = 100;
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

let consecutiveZeroQueueLengthCount = 0;

const adjustInstanceCount = async () => {
  try {
    const queueLength = await getQueueLength();
    console.log(`Queue length: ${queueLength}`);
    const instances = await getAppTierInstances();
    console.log(`App Tier Instances: ${instances}`);
    if (queueLength > 0) {
      if (queueLength >= 30) {
        const required = MAX_INSTANCES - instances.length;
        if (required > 0) await spawnInstances(instances.length, MAX_INSTANCES);
      } else if (queueLength > 0) {
        const required = MAX_INSTANCES / 2 - instances.length;
        if (required > 0)
          await spawnInstances(instances.length, MAX_INSTANCES / 2);
      }
    } else if (instances.length > 0) {
      consecutiveZeroQueueLengthCount++;
      if (consecutiveZeroQueueLengthCount == 4) {
        console.log("Terminating");
        terminateInstances(instances);
        console.log("Scaling down to 0 instances");
        consecutiveZeroQueueLengthCount = 0;
      }
    }
  } catch (error) {
    console.error("Error adjusting instance count:", error);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startPolling = async () => {
  while (true) {
    await adjustInstanceCount();
    await sleep(10000);
  }
};

startPolling();
