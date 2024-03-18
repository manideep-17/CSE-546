const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});
const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const { fetchResponses, deleteMessage } = require("./sqs");

const port = 8000;
const app = express();
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

let responses = {};
const fetchAndUpdateResponse = async () => {
  try {
    responses = await fetchResponses(responses);
    console.log(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
  }
};

setInterval(fetchAndUpdateResponse, 5000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pushToSQS = async (req, res) => {
  let { originalname: file } = req.file;
  let uuid = uuidv4();
  const params = {
    QueueUrl: process.env.REQUEST_QUEUE,
    MessageBody: JSON.stringify({ file, uuid }),
  };
  try {
    await sqs.sendMessage(params).promise();
    await sleep(3000);
    while (true) {
      if (responses[uuid]) {
        await deleteMessage(
          process.env.RESPONSE_QUEUE,
          responses[uuid].receiptHandle
        );
        console.log("found response", JSON.stringify(responses[uuid]));
        const recognition = responses[uuid].response;
        delete responses[uuid];
        return res.status(200).send(`${file.split(".")[0]}:${recognition}`);
      }
      await sleep(1000);
    }
  } catch (err) {
    res.status(400).send(`Failed to push to SQS: ${file}.`);
  }
};

app.post("/", upload.single("inputFile"), pushToSQS);

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
