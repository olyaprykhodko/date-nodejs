document
  .guerySelector('.search-icon-button')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    this.submit();
  });
