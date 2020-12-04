const express = require('express')
var bodyParser = require('body-parser')
const linkPreviewGenerator = require("link-preview-generator")
const cors = require('cors')
const nosc = require('node-osc')
const ws = require('ws')

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
const server = app.listen(port, () => console.log(`listening on ${port}`));
let sockets = []

// Set up a headless websocket server that prints any
// events that come in.
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {      
  // Add our new socket to sockets array for future reference
  sockets.push(socket)

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', () => {
    sockets = sockets.filter(s => s !== socket);
  });
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request)
  })
})

const Server = nosc.Server

const oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening')
})

oscServer.on('message', (msg) => {
  console.log(msg)
  sockets.forEach(s => s.send(JSON.stringify({ type: msg[0], value: msg[1] })));
})