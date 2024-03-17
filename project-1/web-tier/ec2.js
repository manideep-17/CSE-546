const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
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
  var params = {
    ImageId: "ami-02baeedfad2d59fb0",
    InstanceType: "t2.micro",
    KeyName: "CSE-546-key-pair",
    MaxCount: maxCount,
    MinCount: 1,
    SecurityGroupIds: ["sg-0ab269ed85a1f9ecc"],
    SubnetId: "subnet-00fd16293f5f98b21",
    IamInstanceProfile: {
      Arn: "arn:aws:iam::975049889152:instance-profile/EC2-SQS-FullAccess",
    },
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
  };
  try {
    await ec2.runInstances(params).promise();
  } catch (error) {
    console.error("Error spawning instances:", error);
  }
};
