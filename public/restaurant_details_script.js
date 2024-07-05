async function deleteReservation(button) {
  // clear previous error
  const siblings = button.parentElement.children;
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i].tagName === 'P') {
      siblings[i].remove();
    }
  }

  // request deletion
  const ids = button.id.split('_');
  const id = ids[ids.length - 1];
  const response = await fetch('/delete_reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  // show result
  if (response.status === 200) {
    button.parentElement.remove();
  } else {
    const errorText = document.createElement('p');
    const errorContent = document.createElement('b');

    if (response.status === 403) {
      errorContent.textContent = 'Error 403: Forbidden!';
    } else if (response.status === 401) {
      errorContent.textContent = 'Error 401: Unauthorized!';
    } else {
      errorContent.textContent = "Error: Couldn't delete reservation!";
    }

    errorText.appendChild(errorContent);
    button.parentElement.appendChild(errorText);
  }
}

function checkIfEmptied(ul) {
  if (!ul.children || ul.children.length === 1) {
    const emptyText = document.createElement('p');
    emptyText.textContent = 'There are no pending reservations.';
    ul.parentElement.appendChild(emptyText);
  }
}

async function deletePic(button) {
  // request deletion
  const parts = button.id.split('_');
  const picName = parts[parts.length - 1];
  const response = await fetch('/delete_pic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ picName }),
  });

  if (response.status === 200) {
    // success
    const imgs = document.getElementsByClassName('customPic');
    Array.from(imgs).forEach((img) => {
      const thisSrc = img.src.substring(window.location.origin.length);
      if (thisSrc === picName) {
        img.parentElement.parentElement.removeChild(img.parentElement); // remove containing div
      }
    });
  } else {
    button.style.backgroundColor = 'red';
  }
}

async function adminDeleteReservation(button) {
  // request deletion
  const ids = button.id.split('_');
  const id = ids[ids.length - 1];
  const response = await fetch('/delete_reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  // show result
  if (response.status === 200) {
    const resDiv = document.getElementById(`div_reservation_${id}`);
    resDiv.parentElement.removeChild(resDiv);
    checkIfEmptied(button.parentElement.parentElement);
    button.parentElement.remove();
  } else {
    button.parentElement.style.textDecoration = 'line-through';
  }
}

async function adminApproveReservation(button) {
  // request deletion
  const ids = button.id.split('_');
  const id = ids[ids.length - 1];
  const response = await fetch('/approve_reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  // show result
  if (response.status === 200) {
    const resDiv = document.getElementById(`div_reservation_${id}`);
    const resTitle = resDiv.children[0].textContent;
    resDiv.children[0].textContent = resTitle.substring(resTitle.search('Reservation'));
    resDiv.className = '';
    checkIfEmptied(button.parentElement.parentElement);
    button.parentElement.remove();
  } else {
    button.parentElement.style.textDecoration = 'line-through';
  }
}

async function deletePastReservations(button) {
  const restaurantID = button.id.split('_')[1];
  const response = await fetch('/delete_past', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantID }),
  });

  if (response.status === 200) {
    window.location.href = `${window.location.origin}/restaurant_details?id=${restaurantID}`;
  } else {
    button.style.backgroundColor = 'red';
  }
}

async function deleteAllPics(button) {
  const restaurantID = button.id.split('_')[1];
  const response = await fetch('/delete_all_pics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantID }),
  });

  if (response.status === 200) {
    window.location.href = `${window.location.origin}/restaurant_details?id=${restaurantID}`;
  } else {
    button.style.backgroundColor = 'red';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.getElementsByClassName('reservationDeleteButton');
  Array.from(deleteButtons).forEach((d) => {
    d.addEventListener('click', () => deleteReservation(d));
  });

  const adminDeleteButtons = document.getElementsByClassName('deletePending');
  Array.from(adminDeleteButtons).forEach((d) => {
    d.addEventListener('click', () => adminDeleteReservation(d));
  });

  const adminApproveButtons = document.getElementsByClassName('acceptPending');
  Array.from(adminApproveButtons).forEach((d) => {
    d.addEventListener('click', () => adminApproveReservation(d));
  });

  const picDeleteButtons = document.getElementsByClassName('picDeleteButton');
  Array.from(picDeleteButtons).forEach((d) => {
    d.addEventListener('click', () => deletePic(d));
  });

  const adminDelButtons = document.getElementsByClassName('adminDelete');
  if (adminDelButtons.length === 0) {
    return;
  }

  const deletePastButton = adminDelButtons[0];
  deletePastButton.addEventListener('click', () => deletePastReservations(deletePastButton));

  const deletePicsButton = adminDelButtons[1];
  deletePicsButton.addEventListener('click', () => deleteAllPics(deletePicsButton));
});
