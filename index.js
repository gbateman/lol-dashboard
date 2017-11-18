const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const request = require('request');

const leagueEndpoint = "https://na1.api.riotgames.com/lol/league/v3/positions/by-summoner/$";

const riotHeader = {
  "X-Riot-Token": process.env.RIOT_API_KEY
}

const tiers = [
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'MASTER',
  'CHALLENGER'
];

const ranks = [
  'V',
  'IV',
  'III',
  'II',
  'I'
];

const myId = 30409517;
const friendIds = [
  29362558, // John
  28356954, // Andrew
  30370679, // Noah
  19111203, // Connor
  19161965, // Stevie
  36570422, // Cam
  23587917, // Gragon
  35849909, // Javidd
  35738225, // Gerrard
  // 30921162, // Nik
];

let myRank;
let friendRanks = {};

app.set('port', process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

function optionsWithId(id) {
  return {
    url: leagueEndpoint.replace('$', id),
    headers: riotHeader
  }
}

function soloQueueRankFromJSON(json) {
  let soloQueueRank;
  for(let i = 0; i < json.length; i++) {
    if(json[i].queueType == 'RANKED_SOLO_5x5') {
      soloQueueRank = json[i];
      break;
    }
  }
  return soloQueueRank ? {
    "tier": soloQueueRank.tier,
    "queueType": soloQueueRank.queueType,
    "rank": soloQueueRank.rank,
    "name": soloQueueRank.playerOrTeamName,
    "leaguePoints": soloQueueRank.leaguePoints,
    "wins": soloQueueRank.wins,
    "losses": soloQueueRank.losses,
    "effectiveRank": function() {
      return tiers.indexOf(this.tier) * 505
                    + ranks.indexOf(this.rank) * 101
                    + this.leaguePoints;
    }
  } : null;
}

function requestWithId(id, res, callback) {
  request(optionsWithId(id), function(error, response, body) {
    if (!error && response.statusCode == 200) {
      const json = JSON.parse(body);
      callback(json);
    } else {
      error && console.log(error);
      console.log(response.statusCode);
      res.status(400);
      res.send('Riot fucked up. Status: ' + res.statusCode + (error && (', ' + error)));
    }
  });
}

app.get('/', function(req, res) {
  requestWithId(myId, res, function(json){
    myRank = soloQueueRankFromJSON(json);

    let requestCounter = 0;
    for(let i = 0; i < friendIds.length; i++) {
      if(!friendRanks[friendIds[i]]) {
        requestCounter++;
        requestWithId(friendIds[i], res, function(json){
          let friendRank = soloQueueRankFromJSON(json);
          if(friendRank) {
            friendRanks[friendIds[i]] = friendRank;
          }

          requestCounter--;
          if(requestCounter == 0) {
            let allRanks = Object.assign({}, friendRanks);
            allRanks[myId.toString()] = myRank;
            console.log(allRanks);
            const sortedIds = Object.keys(allRanks).sort(function(a, b){
              console.log(a, b);
              console.log(allRanks[a], allRanks[a]);
              return allRanks[b].effectiveRank() - allRanks[a].effectiveRank();
            });
            allRanks = sortedIds.map(function(key) {
              return allRanks[key];
            });

            const myIndex = sortedIds.indexOf(myId.toString());
            const betterRanks = allRanks.slice(0, myIndex);
            const worseRanks = allRanks.slice(myIndex + 1, allRanks.length);

            res.render('index', {betterRanks: betterRanks, myRank: myRank, worseRanks: worseRanks});
          }
        });
      }
    }
  });
});

app.get('/riot.txt', function(req, res) {
  res.sendFile(__dirname + '/riot.txt');
})

app.listen(app.get('port'), function() {
  console.log('App is running on port: ' + app.get('port'));
})
