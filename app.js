const express = require('express');
const app = express();
const cors = require('cors');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { searchCity } = require('./geonames');

const corsOptions = {
    origin: '*', 
};

const PORT = 3500;

dayjs.extend(utc);
dayjs.extend(timezone);

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
    const now = dayjs();
    let time = now.format('HH:mm:ss');
    let zone = dayjs.tz.guess();
    let date = now.format('dddd, D MMMM, YYYY');

    res.render('index', { time, zone, date });
});

app.get('/time', cors(corsOptions), (req, res) => {
    const now = dayjs();
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.json({ time: now.format('HH:mm:ss')});
});

app.get('/search', async (req, res) => {
    const cityName = req.query.city;
    const cityInfo = await searchCity(cityName);

    if (!cityInfo.error) { 
        const randomIndexes = getRandomIndexes(cityInfo.capitalsWithTheSameTimezone.length, 3); // Получаем только 3 случайных индекса
        const randomGeonames = randomIndexes.map(index => cityInfo.capitalsWithTheSameTimezone[index]);
        
        const now = dayjs().tz(`${cityInfo.region}/${cityInfo.cityName}`);
        const time = now.format('HH:mm');
        const date = now.format('dddd, D MMMM, YYYY');

        res.render('search', { cityInfo, randomGeonames, time, date, city: cityName});

    }
});

function getRandomIndexes(max, count) {
    const indexes = [];
    while (indexes.length < count) {
        const randomIndex = Math.floor(Math.random() * max);
        if (!indexes.includes(randomIndex)) {
            indexes.push(randomIndex);
        }
    }
    return indexes;
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
