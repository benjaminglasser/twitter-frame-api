const express = require('express')
var bodyParser = require('body-parser')
const linkPreviewGenerator = require("link-preview-generator")
const cors = require('cors')
const secrets =  require("./secrets.js")
const seeds = require('./seeds')

const app = express()

var Twit = require('twit')

var useSeedData = true;

var T = new Twit({
    consumer_key: secrets.twitterApiKey,
    consumer_secret: secrets.twitterSecretKey, 
    access_token: secrets.twitterAccessToken,
    access_token_secret: secrets.twitterAccessTokenSecret,
})

let tweetBank = [];

app.use(cors())
app.use(bodyParser.json())


app.get('/latest', (req, res, next) => {
  if (!tweetBank.length){
    refreshTweets().then(data => {
      res.send(data)
    }).catch(error => {
      console.error(error)
      res.send(error)
    })
  } else {
    res.send(tweetBank)
  }
});

app.post('/preview', (req, res, next) => {
  const link = req.body.link
  console.log("FETCHING PREVIEW:", link)
  linkPreviewGenerator(link)
    .then(previewData => res.send(previewData))
    .catch(e => {
      console.error("ERROR FETCHING PREVIEW:", e)
      res.send({data: {}})
    });
})

function refreshTweets() {
  return new Promise((resolve, reject) => {
    if (useSeedData) {
        tweetBank = seeds.tweets
        resolve(tweetBank)
    } else {
        T.get('statuses/home_timeline', {count: 100} , function(err, data) {
          if (err) {
            throw (err)
          }
          tweetBank = data
          resolve(tweetBank);
        })  
     }
  })
}


const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`listening on ${port}`));