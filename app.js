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
const { citiesTime } = require('./citiesTime');

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

let intervalId; // global variable to store interval id

app.get('/', async (req, res) => {
  // getting current browser date, time and timezone
  const now = dayjs(); //
  const currentTime = now.format('HH:mm:ss'); //
  const currentTimezone = dayjs.tz.guess(); //
  const currentDate = now.format('dddd, D MMMM, YYYY');

  // getting weather in the current city
  const currentCity = currentTimezone.split('/')[1];
  const data = await searchCity(currentCity);
  const weather = data.responseWeather;

  // pulling user's favorites from the database
  const favorites = await getFavorites();

  res.render('index', {
    currentTime,
    currentTimezone,
    currentDate,
    weather,
    favorites,
  });

  // updating time every second
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    const currentTime = dayjs().format('HH:mm:ss');
    wss.clients.forEach((client) => {
      client.send(currentTime);
    });
  }, 1000);
});

app.get('/city', async (req, res) => {
  try {
    const cityName = req.query.city;
    const cityInfo = await searchCity(cityName);

    // const city =
    //   cityInfo.responseCity.city.charAt(0).toUpperCase() +
    //   cityInfo.responseCity.city.slice(1);

    const city = cityInfo.responseCity.city;

    const timezone = cityInfo.responseCity.timezone;
    const now = dayjs().tz(timezone);
    const time = now.format('HH:mm:ss');
    const date = dayjs(cityInfo.responseTime.datetime).format(
      'dddd, D MMMM, YYYY'
    );

    const cities = await citiesTime();
    console.log(cities);

    const favorites = await getFavorites();
    const isFavorite = favorites.some((favorite) => favorite.city === cityName);
    const buttonText = isFavorite
      ? 'Delete from Favorites'
      : 'Add to Favorites';

    res.render('city', {
      city,
      timezone,
      time,
      date,
      buttonText,
      cities,
    });

    if (intervalId) clearInterval(intervalId); // stop the previous interval if it exists
    intervalId = setInterval(() => {
      const currentTime = dayjs().tz(timezone).format('HH:mm:ss');
      wss.clients.forEach((client) => {
        client.send(currentTime); // send updated time to all connected clients
      });
    }, 1000);
  } catch (error) {
    console.error('Error searching for city:', error);
    res.render('error', { error: 'Error searching for city' });
    return;
  }
});

app.get('/favorites', async (req, res) => {
  try {
    const favorites = await getFavorites();
    res.render('favorites', { favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.render('error', { error: 'Error fetching favorites' });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/how-to-use', (req, res) => {
  res.render('how-to-use');
});

app.post('/add-to-favorites', async (req, res) => {
  let { city, timezone } = req.body;
  console.log('Received cityName:', city);
  console.log('Received timezone:', timezone);
  try {
    const existingFavorite = await pool.query(
      'SELECT * FROM favorites WHERE city = $1',
      [city]
    );
    let isFavorite = false;
    if (existingFavorite.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE city = $1', [city]);
    } else {
      await pool.query(
        'INSERT INTO favorites (city, timezone) VALUES ($1, $2)',
        [city, timezone]
      );
      isFavorite = true;
    }
    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error('Error adding/removing from favorites:', error);
    res.status(500).json({ error: 'Error adding/removing from favorites' });
  }
});

app.use((req, res, next) => {
  res.status(404).send('404 Not Found');
});

async function getFavorites() {
  const data = await pool.query('SELECT * FROM favorites');
  // console.log('Favorites:', data.rows);
  return data.rows;
}

app.listen(PORT, () => {
  createTable()
    .then(() => {
      console.log(`PORT ${PORT} is running`);
    })
    .catch((error) => {
      console.error('Error creating table:', error);
    });
}); // creating table in the database if it doesn't exist and starting the server
