

var secrets =  require("./secrets.js")

var Twit = require('twit');

var T = new Twit({
    consumer_key: secrets.twitterApiKey,
    consumer_secret: secrets.twitterSecretKey, 
    access_token: secrets.twitterAccessToken,
    access_token_secret: secrets.twitterAccessTokenSecret,
})

var options = {};

T.get('statuses/home_timeline', options , function(err, data) {
  for (var i = 0; i < data.length ; i++) {
    console.log(data[i]);
  }
})

