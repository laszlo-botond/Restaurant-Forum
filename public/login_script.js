async function tryToLogin(event, loginButton) {
  event.preventDefault();

  // clear previous errors
  const errors = document.getElementsByClassName('errorText');
  for (let i = 0; i < errors.length; i++) {
    loginButton.parentElement.removeChild(errors[i]);
  }

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/login', {
    credentials: 'same-origin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.status !== 200) {
    const errorText = document.createElement('p');
    errorText.className = 'errorText';
    const errorContent = document.createElement('b');
    errorContent.textContent = 'Incorrect username/password!';

    errorText.appendChild(errorContent);
    loginButton.parentElement.appendChild(errorText);
  } else {
    window.location.href = window.location.origin;
  }
}

async function tryToRegister(event, registerButton) {
  event.preventDefault();

  // clear previous errors
  const errors = document.getElementsByClassName('errorText');
  for (let i = 0; i < errors.length; i++) {
    registerButton.parentElement.removeChild(errors[i]);
  }

  const firstname = document.getElementById('reg_firstname').value;
  const lastname = document.getElementById('reg_lastname').value;
  const username = document.getElementById('reg_username').value;
  const password = document.getElementById('reg_password').value;

  const response = await fetch('/register', {
    credentials: 'same-origin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, firstname, lastname }),
  });

  if (response.status !== 200) {
    const errorText = document.createElement('p');
    errorText.className = 'errorText';
    const errorContent = document.createElement('b');
    if (response.status === 403) errorContent.textContent = 'Username is taken!';
    else errorContent.textContent = 'All fields are required!';

    errorText.appendChild(errorContent);
    registerButton.parentElement.appendChild(errorText);
  } else {
    window.location.href = window.location.origin;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  loginButton.addEventListener('click', (event) => tryToLogin(event, loginButton));

  const registerButton = document.getElementById('registerButton');
  registerButton.addEventListener('click', (event) => tryToRegister(event, registerButton));
});
