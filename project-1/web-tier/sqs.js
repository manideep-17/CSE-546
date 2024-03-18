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

exports.fetchResponses = async (input) => {
  const params = {
    QueueUrl: process.env.RESPONSE_QUEUE,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 10,
    VisibilityTimeout: 45,
  };
  try {
    const data = await sqs.receiveMessage(params).promise();
    const messages = data.Messages || [];
    console.log(JSON.stringify({ messages }));

    for (const message of messages) {
      const messageBody = JSON.parse(message.Body); // Assuming message body is JSON
      const { uuid, response } = messageBody; // Destructure uuid, response, and ReceiptHandle from messageBody
      console.log({ uuid, response });
      input[uuid] = {
        response: response.trim(),
        receiptHandle: message.ReceiptHandle,
      };
    }
    return input;
  } catch (error) {
    console.error("Error polling SQS:", error);
    return response;
  }
};

exports.deleteMessage = async (queueURL, receiptHandle) => {
  try {
    const deleteParams = {
      QueueUrl: queueURL,
      ReceiptHandle: receiptHandle,
    };

    const data = await sqs.deleteMessage(deleteParams).promise();
    console.log("Message deleted successfully.");
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};
