const dotenv = require('dotenv');
const express = require('express');
const app = express();
const request = require('request');

const leagueEndpoint = "https://na1.api.riotgames.com/lol/league/v3/positions/by-summoner/$";

const riotHeader = {
  "Origin": "https://developer.riotgames.com",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Riot-Token": process.env.RIOT_API_KEY
}

const myId = 30409517;
const friendIds = [
  43622871, // John
  42722081, // Andrew
  30370679, // Noah
  19111203, // Connor
  31856445, // Stevie
  36570422, // Cam
  37710415, // Gragon
  35849909, // Javidd
  35738225, // Gerrard
]

let myRank;
let friendRanks = {};

app.set('port', process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

function optionsWithId(id) {
  return {
    url: leagueEndpoint.replace('$', id),
    headers: riotHeader
  }
}

function soloQueueRankFromJSON(json) {
  let soloQueueRank;
  for(let i = 0; i < json.length; i++) {
    if(json[0].queueType == 'RANKED_SOLO_5x5') {
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
  } : null;
}

app.get('/', function(req, res) {
  request(optionsWithId(myId), function(error, response, body) {
    if (!error && response.statusCode == 200) {
      const json = JSON.parse(body);
      myRank = soloQueueRankFromJSON(json);

      let responseCounter = 0;
      for(let i = 0; i < friendIds.length; i++) {
        if(!friendRanks[friendIds[i]]) {
          request(optionsWithId(friendIds[i]), function(error, response, body) {
            if (!error && response.statusCode == 200) {
              console.log(response);
              const json = JSON.parse(body);
              let friendRank = soloQueueRankFromJSON(json);
              if(friendRank) {
                friendRanks[friendIds[i]] = friendRank;
              }

              responseCounter++;
              if(responseCounter == friendIds.length) {
                res.send(friendRanks);
              }
            } else {
              res.status(400);
              res.send(error);
              return;
            }
          });
        } else {
          responseCounter++;
        }
      }
    } else {
      res.status(400);
      res.send(error);
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('App is running on port: ' + app.get('port'));
})
