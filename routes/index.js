document
  .guerySelector('.search-icon-button')
  .addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting
    // Perform any additional actions if needed

    // Submit the form programmatically
    this.submit();
  });
