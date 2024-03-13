const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
});
// Create EC2 service object
const ec2 = new AWS.EC2();

// Define parameters for describeInstances API call
let params = {
  Filters: [
    {
      Name: "tag:tier", // Replace with your tag key
      Values: ["app-tier"], // Replace with your tag value
    },
    {
      Name: "instance-state-name",
      Values: ["running"], // Include only running instances
    },
  ],
};

// Call EC2 to retrieve policy for selected bucket
ec2.describeInstances(params, function (err, data) {
  if (err) {
    console.log("Error", err.stack);
  } else {
    console.log("Success", JSON.stringify(data));
    const instances = data.Reservations.flatMap(
      (reservation) => reservation.Instances
    );
    const runningInstanceCount = instances.length;
    console.log(
      "Number of running instances with the specified filters:",
      runningInstanceCount
    );
  }
});
