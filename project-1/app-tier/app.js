const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

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
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const execAsync = promisify(exec);

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

const s3 = new AWS.S3();

const uploadToS3 = async (bucket, key, body) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
  };
  try {
    await s3.upload(params);
  } catch (err) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

const receiveAndProcessMessages = async () => {
  try {
    const params = {
      QueueUrl: process.env.REQUEST_QUEUE,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 30,
    };

    const data = await sqs.receiveMessage(params).promise();
    console.log(JSON.stringify(data.Messages));
    if (data.Messages) {
      for (let i = 0; i < data.Messages.length; i++) {
        let message = data.Messages[i];
        const messageBody = JSON.parse(message.Body);
        console.log("Received Message:", messageBody);
        const { file, uuid } = messageBody;

        const filePath = `/home/ubuntu/face_images_1000/${file}`;

        const command = `python3 /home/ubuntu/model/face_recognition.py ${filePath}`;
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          throw new Error(`Error output: ${stderr}`);
        }

        let img = await fs.readFile(filePath);
        await uploadToS3(process.env.IN_S3_BUCKET_ARN, file.split(".")[0], img);

        await uploadToS3(
          process.env.OUT_S3_BUCKET_ARN,
          file.split(".")[0],
          stdout.trim()
        );

        console.log(stdout);
        const response = {
          uuid,
          file,
          response: `${stdout}`,
        };
        await pushToSQS(response);
        await deleteMessage(message.ReceiptHandle);
      }
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
  }
};

startPolling();
