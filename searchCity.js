async function searchCity(capital) {
  const searchCity = await fetch(
    `https://restcountries.com/v3.1/capital/${capital}`
  ).then((response) => response.json());

  const cityInfo = searchCity[0];
  //   console.log(cityInfo.capital);
  if (!cityInfo) {
    return { error: 'City not found or not enough data' };
  }

  let utc = cityInfo.timezones[0];
  if (capital === 'London' || capital === 'london') utc = cityInfo.timezones[5];

  const allData = await fetch('https://restcountries.com/v3.1/all').then(
    (response) => response.json()
  );
  // console.log(allData);
  const capitalsWithTheSameTimezone = [];

  allData.forEach((country) => {
    country.timezones.forEach((timezone) => {
      if (timezone === utc) {
        capitalsWithTheSameTimezone.push({
          cityName: country.capital,
          countryName: country.name.common,
          timezone: timezone,
        });
      }
    });
  });

  // console.log(capitalsWithTheSameTimezone);
  return {
    city: cityInfo.capital.join(''),
    countryName: cityInfo.name.common,
    timezone: utc,
    capitalsWithTheSameTimezone: capitalsWithTheSameTimezone,
    subregion: cityInfo.subregion,
    region: cityInfo.region,
  };
}

module.exports = { searchCity };
