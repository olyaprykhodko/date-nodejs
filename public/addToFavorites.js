async function addToFavorites(city, timezone) {
  try {
    const response = await fetch('/add-to-favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        timezone,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const isFavorite = data.isFavorite;
      updateFavoritesUI(isFavorite);
      if (isFavorite) {
        alert('City added to favorites');
      } else {
        alert('City removed from favorites');
      }
    } else {
      console.error('Failed to add city to favorites');
      alert('Failed to add city to favorites');
    }
  } catch (error) {
    console.error(error);
    alert('Error occurred while adding the city to favorites');
  }
}

function updateFavoritesUI(isFavorite) {
  const button = document.querySelector('.add-to-fav');
  button.textContent = isFavorite
    ? 'Delete from Favorites'
    : 'Add to Favorites';
}
