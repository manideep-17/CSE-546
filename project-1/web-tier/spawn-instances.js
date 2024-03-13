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

var params = {
  ImageId: "ami-abc12345",
  InstanceType: "t2.micro",
  KeyName: "my-key-pair",
  MaxCount: 1,
  MinCount: 1,
  SecurityGroupIds: ["sg-1a2b3c4d"],
  SubnetId: "subnet-6e7f829e",
  TagSpecifications: [
    {
      ResourceType: "instance",
      Tags: [
        {
          Key: "tier",
          Value: "app-tier",
        },
      ],
    },
  ],
};
ec2.runInstances(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else console.log(data); // successful response
  /*
   data = {
   }
   */
});
