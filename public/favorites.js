async function addToFavorites() {
  const cityName = document.querySelector('.city-name').textContent;
  const countryName = document.querySelector('.country-name').textContent;
  const region = document.querySelector('.region').textContent;
  const subregion = document.querySelector('.subregion').textContent;
  const timezone = document.querySelector('.timezone').textContent;

  try {
    const response = await fetch('/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cityName,
        countryName,
        region,
        subregion,
        timezone,
      }),
    });

    if (response.ok) {
      alert('The city added to favorites');
    } else throw new Error('Error occurred');
  } catch (error) {
    console.error(error);
    alert('Error occurred while adding the city to favorites');
  }
}
