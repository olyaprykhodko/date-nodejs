const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

async function citiesTime() {
  const now = dayjs();
  const London = now.tz('Europe/London').format('HH:mm');
  const NewYork = now.tz('America/New_York').format('HH:mm');
  const Tokyo = now.tz('Asia/Tokyo').format('HH:mm');
  const Sydney = now.tz('Australia/Sydney').format('HH:mm');
  const Beijing = now.tz('Asia/Shanghai').format('HH:mm');
  const CapeTown = now.tz('Africa/Johannesburg').format('HH:mm');

  return {
    London,
    NewYork,
    Tokyo,
    Sydney,
    Beijing,
    CapeTown,
  };
}

module.exports = { citiesTime };
