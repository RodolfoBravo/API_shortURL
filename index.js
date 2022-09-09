require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
var dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'sample.env' });
// Basic Configuration
// Connection with database
const connection = mongoose.connection;
connection.on('error',console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Connection with database mongo correct")
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

const URL_db = mongoose.model("URL",urlSchema)



const port = process.env.PORT || 3000;
let urls = {};

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function(req, res) {
  const inUrl = req.body.url;
  let urlObject = new URL(inUrl); 
  const urlCode = Math.floor(Math.random() * (100 - 1) + 1);
  console.log(urlCode);

  dns.lookup(urlObject.hostname, async function (err, address, family) { 
   var isValid = err == null ? true : false ;
  if (isValid) {
    let findOne = await URL_db.findOne({
      original_url: inUrl
    });
    if (findOne) {
      res.json({
        original_url: findOne.original_url,
        short_url: findOne.short_url
      })
    } else{
      findOne = new URL_db({
        original_url:inUrl,
        short_url:urlCode
      })
      await findOne.save()
      res.json({
        original_url:findOne.original_url, 
        short_url:findOne.short_url});
    }
    
  } else {
    res.json({ error: 'invalid url' })
  }
 
  });
})

app.get('/api/shorturl/:shorturl', async function (req, res) {
  var short = req.params.shorturl;
  console.log(short);
  let data = await URL_db.findOne({
        short_url: short
      });
      if (data) {
        return res.redirect(data.original_url)
      } else{
        return res.json({'error':'No URL found'});
      }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
