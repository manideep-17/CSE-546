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
});

const port = 3000;
const app = express();
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

// let data = fs.readFileSync(
//   path.join(`${__dirname}`, "/data/classification_results.csv"),
//   "utf8"
// );
// data = data.split("\n");
// let classification = {};
// for (let i = 0; i < data.length; i++) {
//   let fileName = data[i].split(",")[0];
//   let value = data[i].split(",")[1].trim();
//   classification[fileName] = value;
// }

// const classifer = (req, res) => {
//   let { originalname: file } = req.file;
//   file = file.split(".")[0];
//   res.status(200).send(`${file}:${classification[file]}`);
// };

const pushToSQS = (req, res) => {
  let { originalname: file } = req.file;
  file = file.split(".")[0];
  const params = {
    QueueUrl: process.env.REQUEST_QUEUE,
    MessageBody: JSON.stringify({ file, uuid: uuidv4() }),
  };
  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).send(`Failed to push to SQS: ${file}.`);
    } else {
      res.status(200).send(`Pushed ${file} to SQS. Awaiting response.`);
    }
  });
};

app.post("/", upload.single("inputFile"), pushToSQS);

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
