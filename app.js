const express = require('express');
const app = express();
const PORT = 3500;
const cors = require('cors');

const dayjs = require('dayjs'); // node library for manipulating Date object
const utc = require('dayjs/plugin/utc'); // plugin for dayjs to work with UTC
const timezone = require('dayjs/plugin/timezone'); // plugin for dayjs to work with timezones
dayjs.extend(utc);
dayjs.extend(timezone);

const { Pool } = require('pg'); // importing client for working with PostgreSQL
const dotenv = require('dotenv');
dotenv.config();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }); // creating WebSocket server

const { searchCity } = require('./searchCity');

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(cors());
// const corsOptions = {
//   origin: '*',
// };

app.use(express.static('public'));
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  port: 5432,
}); // connection to PostgreSQL

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    ws.send(message);
  });
});

async function createTable() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, city_name TEXT, country_name TEXT, region TEXT, subregion TEXT, timezone TEXT)'
  );
}

app.get('/', async (req, res) => {
  const now = dayjs(); //
  const currentTime = now.format('HH:mm:ss'); //
  const currentTimezone = dayjs.tz.guess(); //
  const currentDate = now.format('dddd, D MMMM, YYYY'); // getting current browser date, time and timezone

  const favorites = await getFavorites(); // pulling user's favorites from the database
  res.render('index', { currentTime, currentTimezone, currentDate, favorites });
});

app.get('/time', (req, res) => {
  const now = dayjs();
  res.json({ time: now.format('HH:mm:ss') }); // sending current time in the separate route to update it every second in the update-time.js
});

let intervalId; // global variable to store interval id

app.get('/search', async (req, res) => {
  const cityName = req.query.city; // getting city name from the query
  const cityInfo = await searchCity(cityName); // getting city information from the searchCity.js
  console.log(cityInfo);

  if (!cityInfo.error) {
    const randomIndexes = getRandomIndexes(
      cityInfo.capitalsWithTheSameTimezone.length,
      3
    );
    const randomGeonames = randomIndexes.map(
      (index) => cityInfo.capitalsWithTheSameTimezone[index]
    ); // getting three random cities with the same timezone

    const now = dayjs().tz(`${cityInfo.region}/${cityInfo.city}`);
    let time = updateTime(cityInfo);
    const date = now.format('dddd, D MMMM, YYYY');

    res.render('search', {
      cityInfo,
      randomGeonames,
      time,
      date,
      city: cityName,
    });

    if (intervalId) clearInterval(intervalId); // stop the previous interval if it exists

    intervalId = setInterval(() => {
      time = updateTime(cityInfo); // update time every second
      wss.clients.forEach((client) => {
        client.send(time); // send updated time to all connected clients
      });
    }, 1000);
  }
});

app.post('/favorites', async (req, res) => {
  const { cityName, countryName, region, subregion, timezone } = req.body;
  try {
    await pool.query(
      'INSERT INTO favorites (city, country_name, region, subregion, timezone) VALUES ($1, $2, $3, $4, $5)',
      [cityName, countryName, region, subregion, timezone]
    ); // adding favorite city to the database
    res.sendStatus(200);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Error adding to favorites' });
  }
});

app.get('/favorites/:cityName', async (req, res) => {
  const cityName = req.params.cityName;

  try {
    const result = await pool.query('SELECT * FROM favorites WHERE city = $1', [
      cityName,
    ]);
    const cityInfo = result.rows[0];

    if (!cityInfo) {
      return res.status(404).send('City not found');
    }

    const date = dayjs()
      .tz(`${cityInfo.region}/${cityInfo.city}`)
      .format('dddd, D MMMM, YYYY');
    let time = updateTime(cityInfo);

    res.render('favorite-city', { cityInfo, date, time, cityName });

    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(() => {
      time = updateTime(cityInfo);
      wss.clients.forEach((client) => {
        client.send(time);
      });
    }, 1000);
  } catch (error) {
    console.error('Error retrieving city information:', error);
    res.status(500).json({ error: 'Error retrieving city information' });
  }
});

async function getFavorites() {
  const data = await pool.query('SELECT * FROM favorites');
  return data.rows;
}

// function to get current time in the city
function updateTime(cityInfo) {
  return dayjs().tz(`${cityInfo.region}/${cityInfo.city}`).format('HH:mm:ss');
}

function getRandomIndexes(max, count) {
  const indexes = [];
  while (indexes.length < count) {
    const randomIndex = Math.floor(Math.random() * max);
    if (!indexes.includes(randomIndex)) {
      indexes.push(randomIndex);
    }
  }
  return indexes;
} // function to get random indexes for random cities

createTable().then(() => {
  app.listen(PORT, () => {
    console.log(`PORT ${PORT} is running`);
  });
}); // creating table in the database if it doesn't exist and starting the server
