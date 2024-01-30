const fs = require('fs')
const path = require('path')

const express = require('express')
const morgan = require('morgan')

const port = 3000
const app = express()

// Middlewares
app.use(morgan('dev'));
app.use(express.json());

let data = fs.readFileSync(path.join(`${__dirname}`, '/data/classification_results.csv'), 'utf8');
data = data.split("\n")
let classification = {}
for(let i=0; i<data.length; i++){
    let fileName = data[i].split(",")[0]
    let value = data[i].split(",")[1].trim()
    classification[fileName] = value
}
const classifer = (req, res) => {
    const {file} = req.body 
    res.status(400).json({
        "status": "success",
        "response": `${file}:${classification[file]}`
    })
}

app.post('/', classifer);

app.listen(port, ()=>{
    console.log(`Server started at port ${port}`)
})