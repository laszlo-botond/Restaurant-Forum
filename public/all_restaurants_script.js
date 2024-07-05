async function getFullInfo(restaurant, ul) {
  // if list has the extra elements, remove them
  if (ul.children.length > 2) {
    while (ul.children.length > 2) {
      ul.removeChild(ul.lastChild);
    }
    return;
  }

  // request extra information
  const id = restaurant.id.split('_')[1];
  const response = await fetch(`/get_extra_info?id=${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status !== 200) {
    const errorLine = document.createElement('li');
    errorLine.textContent = 'Error fetching restaurant info!';
    errorLine.style.color = 'red';
    ul.appendChild(errorLine);
    return;
  }
  const data = await response.json();

  // create elements from extra information
  const addressLine = document.createElement('li');
  addressLine.textContent = `Address: ${data.Town}, ${data.Street}, ${data.AddrNum}`;

  const phoneLine = document.createElement('li');
  phoneLine.textContent = `Phone: ${data.Phone}`;

  // add elements
  ul.appendChild(addressLine);
  ul.appendChild(phoneLine);
}

document.addEventListener('DOMContentLoaded', () => {
  const restaurantNames = document.getElementsByClassName('restaurantName');
  for (let i = 0; i < restaurantNames.length; i++) {
    const listOfRestaurant = restaurantNames[i].parentElement.children[1];
    restaurantNames[i].addEventListener('click', () => getFullInfo(restaurantNames[i], listOfRestaurant));
  }
});
