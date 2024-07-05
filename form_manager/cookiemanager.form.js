import jwt from 'jsonwebtoken';

const secret = 'SSA8MyB3ZWIgcHJvZ3JhbW1pbmc';

function verifyCookie(cookie) {
  const userCookie = cookie;
  let ok = false;
  if (userCookie) {
    jwt.verify(userCookie, secret, (err, payload) => {
      if (payload) {
        ok = true;
      }
    });
  }
  return ok;
}

function createCookie(cookieObj) {
  return jwt.sign(cookieObj, secret);
}

function getUserName(cookie) {
  const decoded = jwt.verify(cookie, secret);
  return decoded.username;
}

export default {
  secret,
  verifyCookie,
  createCookie,
  getUserName,
};
