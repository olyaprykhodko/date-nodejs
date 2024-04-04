async function searchCity(city) {
  let URL = 'https://api.api-ninjas.com/v1/';
  const requestCity = await fetch(URL + 'timezone?city=' + city, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.API_KEY,
    },
  });

  const requestTime = await fetch(URL + 'worldtime?city=' + city, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.API_KEY,
    },
  });

  const requestWeather = await fetch(URL + 'weather?city=' + city, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.API_KEY,
    },
  });

  const responseCity = await requestCity.json();
  const responseTime = await requestTime.json();
  const responseWeather = await requestWeather.json();

  return {
    responseTime,
    responseCity,
    responseWeather,
  };
}

module.exports = { searchCity };
