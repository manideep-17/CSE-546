const fs = require("fs");
const path = require("path");

const express = require("express");
const morgan = require("morgan");
const multer = require("multer");

const port = 3000;
const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

let data = fs.readFileSync(
  path.join(`${__dirname}`, "/data/classification_results.csv"),
  "utf8"
);
data = data.split("\n");
let classification = {};
for (let i = 0; i < data.length; i++) {
  let fileName = data[i].split(",")[0];
  let value = data[i].split(",")[1].trim();
  classification[fileName] = value;
}

const classifer = (req, res) => {
  let { originalname: file } = req.file;
  file = file.split(".")[0];
  res.status(200).send(`${file}:${classification[file]}`);
};

app.post("/", upload.single("inputFile"), classifer);

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
