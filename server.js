// Required Imports
const express = require('express')
const mongoose = require('mongoose')
const gridFS = require('gridfs-stream')
const app = express()
const port = 3000
const cors = require("cors")
const bodyParser = require('body-parser')
const fs = require("fs")

app.options('/volcanoSearch', cors())
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to mongodb 
// Needs hosted db URL
const url = "mongodb+srv://group5:group5@volcano.iuvm1.mongodb.net/Volcano?retryWrites=true&w=majority";
//const url = 'mongodb://localhost:27017/Volcano';

// Connect to mongodb
mongoose.connect(url, { useNewUrlParser: true });
// const grid = new gridFS('Volcano', mongoose.mongo)
let grid;
var connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  console.log("Connected!")
  var mongoDriver = mongoose.mongo;
  grid = new gridFS(connection.db, mongoDriver);
});


// Initialize collections
const eruptionSchema = new mongoose.Schema({}, { strict: false })
const volcanoSchema = mongoose.Schema({}, { strict: false });
const gfsSchema = mongoose.Schema({}, { strict: false });

const eruptions = mongoose.model('eruptions', eruptionSchema)
const volcanos = mongoose.model('volcano', volcanoSchema, 'volcano')
const gfs = mongoose.model('fs.files', gfsSchema, 'fs.files')

//Routes
app.post('/eruption', (req, res) => {
    const eruption_number = parseInt(req.body.eruption_number)
    eruptions.findOne({eruption_number: eruption_number}, (err, eruption) => {
        if (err) throw err;
        console.log(eruption);
        res.send(eruption);
    })
});

app.post('/volcano', (req, res) => {
    const volcano_number = parseInt(req.body.volcano_number)
    volcanos.findOne({volcano_number: volcano_number}, (err, volcano) => {
        if (err) throw err;
        console.log(volcano);
        res.send(volcano);
    })
});

app.post('/volcanoSearch', (req, res) => {
    console.log(req.body)
    let text = req.body.text
    const field = req.body.field
    console.log("text=>", text);
    console.log("field=>",field);
    const regex = `\\b${text}.*\\b`
    const data = {};
    data[field] = { $regex: regex, $options: 'i' }
    console.log(data)
    volcanos.find(data, { _id: 0 }, (err, success) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            
            res.send(success);
        }

    })
});

app.post('/eruptionSearch', (req, res) => {
    let text = req.body.text
    const field = req.body.field
    const regex = `\\b${text}.*\\b`
    const data = {};
    data[field] = { $regex: regex, $options: 'i' }
    eruptions.find(data, { _id: 0 }, (err, success) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send(success);
        }

    })
});

app.get('/volcanoFields', (req, res) => {
    volcanos.findOne({}, { _id: 0 }, (err, object) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            object = JSON.stringify(object);
            object = JSON.parse(object);
            const keys = Object.keys(object);
            res.send(keys);
        }
    })
})

app.get('/eruptionFields', (req, res) => {
    eruptions.findOne({}, { _id: 0 }, (err, object) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            object = JSON.stringify(object);
            object = JSON.parse(object);
            const keys = Object.keys(object);
            res.send(keys);
        }
    })
})

app.put('/commentVolcano', (req, res) => {
    const volcano_number = parseInt(req.body.volcano_number);
    const comment = req.body.comment;
    console.log(volcano_number)
    console.log(comment)
    volcanos.findOneAndUpdate({volcano_number: volcano_number}, {$push: {comments: comment}} ,{upsert: true, new: true}, (err, volcano) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            volcano = JSON.stringify(volcano);
            volcano = JSON.parse(volcano);
            res.send(volcano.comments);
        }
    })
})

app.post('/volcanoLocation', (req, res) => {
    const longitude = parseFloat(req.body.longitude);
    const latitude = parseFloat(req.body.latitude);
    const distance = parseFloat(req.body.distance);
    volcanos.find({
        loc:
        {
            $near:
            {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: distance
            }
        }
    },{
        _id: 0,
    }, (err, volcano) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send(volcano)
        }
    })
})

app.post('/eruptionLocation', (req, res) => {
    const longitude = parseFloat(req.body.longitude);
    const latitude = parseFloat(req.body.latitude);
    const distance = parseFloat(req.body.distance);
    eruptions.find({
        loc:
        {
            $near:
            {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: distance
            }
        }
    },{
        _id: 0,
    }, (err, eruption) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send(eruption)
        }
    })
})

app.put('/commentEruption', (req, res) => {
    const eruption_number = parseInt(req.body.eruption_number);
    const comment = req.body.comment;
    eruptions.findOneAndUpdate({eruption_number: eruption_number}, {$push: {comments: comment}}, {upsert: true, new: true}, (err, eruption) => {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            eruption = JSON.stringify(eruption);
            eruption = JSON.parse(eruption);
            res.send(eruption.comments)
        }
    })
})



app.post('/getFile', function (req, res) {
    const db_filename = req.body.db_filename;
    // Check file exist on MongoDB
    gfs.findOne({ filename: db_filename }, function (err, file) {
        if (err || !file) {
            res.send('File Not Found');
        } else {
            // res.set({
            //     'Content-Type': 'image/jpg',
            //     'Content-Disposition': 'attachment; filename=' + file.filename
            // });
            var readstream = grid.createReadStream(db_filename);
            readstream.on("error", function(error) { 
                res.end();
            });
            //readstream.pipe(res);
            let image = [];
            readstream.on('data', function (chunk) {
                image.push(chunk);
            });
            readstream.on('error', e => {
                console.log(e);
                res.end();
            });
            return readstream.on('end', function () {
                image = Buffer.concat(image);
                const img = `data:image/jpg;base64,${Buffer(image).toString('base64')}`;
                res.send(img);
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})