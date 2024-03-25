function updateTime() {
  fetch('/time')
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      document.querySelector('.time').textContent = data.time;
    });
}
updateTime();
setInterval(updateTime, 1000);
