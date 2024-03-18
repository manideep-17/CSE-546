const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
const ec2 = new AWS.EC2();

exports.terminateInstances = async (instanceIds) => {
  try {
    const params = {
      InstanceIds: instanceIds,
    };
    const data = await ec2.terminateInstances(params).promise();
    console.log("Instances terminated:", data.TerminatingInstances);
  } catch (err) {
    console.error("Error terminating instances:", err);
  }
};

exports.getAppTierInstances = async () => {
  let params = {
    Filters: [
      {
        Name: "tag:tier",
        Values: ["app-tier"],
      },
      {
        Name: "instance-state-name",
        Values: ["running", "pending"],
      },
    ],
  };

  try {
    const data = await ec2.describeInstances(params).promise();
    const instances = data.Reservations.flatMap(
      (reservation) => reservation.Instances
    );
    const instanceIds = instances.map((instance) => instance.InstanceId);
    return instanceIds;
  } catch (error) {
    console.error("Error fetching instance count:", error);
  }
};

exports.spawnInstances = async (maxCount) => {
  const userDataScript = `#!/bin/bash
  cd /home/ubuntu/CSE-546/project-1/app-tier
  pm2 start app.js
  `;

  const params = {
    ImageId: "ami-00fbb26532d88db62",
    InstanceType: "t2.micro",
    KeyName: "CSE546-key-pair",
    MaxCount: maxCount,
    MinCount: 1,
    SecurityGroupIds: ["sg-055f709abafd3233b"],
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "tier",
            Value: "app-tier",
          },
          {
            Key: "Name",
            Value: "app-tier-instance-duplicate",
          },
        ],
      },
    ],
    UserData: Buffer.from(userDataScript).toString("base64"),
  };
  try {
    await ec2.runInstances(params).promise();
  } catch (error) {
    console.error("Error spawning instances:", error);
  }
};

// spawnInstances(10);
