const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});
const AWS = require("aws-sdk");
console.log(process.env.REGION);
AWS.config.update({
  region: process.env.REGION,
});
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const deleteMessage = async (receiptHandle) => {
  try {
    const deleteParams = {
      QueueUrl: process.env.REQUEST_QUEUE,
      ReceiptHandle: receiptHandle,
    };

    const data = await sqs.deleteMessage(deleteParams).promise();
    console.log("Message deleted successfully.");
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

const pushToSQS = async (message) => {
  try {
    const params = {
      QueueUrl: process.env.RESPONSE_QUEUE,
      MessageBody: JSON.stringify(message),
    };
    await sqs.sendMessage(params).promise();
  } catch {
    console.error("Error pushing message to SQS:", error);
    throw error;
  }
};

const receiveAndProcessMessages = async () => {
  try {
    const params = {
      QueueUrl: process.env.REQUEST_QUEUE,
      MaxNumberOfMessages: 1, // Change this value based on your requirement
    };

    const data = await sqs.receiveMessage(params).promise();

    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        const messageBody = JSON.parse(message.Body);
        console.log("Received Message:", messageBody);
        const { file, uuid } = messageBody;

        const command = `python3 /home/ubuntu/model/face_recognition.py /home/ubuntu/face_images_1000/${file}`;
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          throw new Error(`Error output: ${stderr}`);
        }

        console.log("Result:");
        console.log(stdout);
        const response = {
          uuid,
          response: stdout,
        };
        await pushToSQS(response);
        // Delete the received message from the queue (if needed)
        await deleteMessage(message.ReceiptHandle);
      });
    } else {
      console.log("No messages received");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const startPolling = async () => {
  while (true) {
    await receiveAndProcessMessages();
    break; // remove during deployment
  }
};

startPolling();
