document.addEventListener('DOMContentLoaded', () => {
  // only allow dates starting tomorrow
  const dateInput = document.getElementById('res_date');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  let month = tomorrowDate.getMonth() + 1;
  let day = tomorrowDate.getDate();
  const year = tomorrowDate.getFullYear();

  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;

  const minDate = `${year}-${month}-${day}`;
  dateInput.setAttribute('min', minDate);
});
