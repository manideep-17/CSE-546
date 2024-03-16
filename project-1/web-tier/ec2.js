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
    const runningInstanceCount = instances.length;
    return runningInstanceCount;
  } catch (error) {
    console.error("Error fetching instance count:", error);
  }
};
