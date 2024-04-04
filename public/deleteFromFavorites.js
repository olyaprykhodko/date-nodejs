function deleteFromFavorites(city) {
  fetch('/add-to-favorites/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ city }),
  })
    .then((response) => {
      if (response.ok) {
        window.location.href = '/';
      } else {
        throw new Error('Error deleting from favorites');
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
