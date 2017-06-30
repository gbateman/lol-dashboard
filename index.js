const dotenv = require('dotenv');
const express = require('express');
const app = express();
const fetch = require('node-fetch');

const leagueEndpoint = "https://na1.api.riotgames.com/lol/league/v3/positions/by-summoner/$";

const riotHeader = {
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

app.set('port', process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  console.log(fetch(leagueEndpoint.replace('$', myId)));
  response.send('<p>test</p>');
});

app.listen(app.get('port'), function() {
  console.log('App is running on port: ' + app.get('port'));
})
