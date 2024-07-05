import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import vine from '@vinejs/vine';
import dbm from '../db/dbmanager.db.js';
import cookieMgr from '../form_manager/cookiemanager.form.js';

// set up vine validator
vine.convertEmptyStringsToNull = true;
const loginSchema = vine.object({
  username: vine.string(),
  password: vine.string(),
});
const registerSchema = vine.object({
  username: vine.string(),
  password: vine.string(),
  firstname: vine.string(),
  lastname: vine.string(),
});
const loginValidator = vine.compile(loginSchema);
const registerValidator = vine.compile(registerSchema);

function approveSubmission(req, res, next) {
  // szinkron verify hivas
  if (!req.cookies.usercookie || !jwt.verify(req.cookies.usercookie, cookieMgr.secret)) {
    res.redirect('/no_auth.html');
    return;
  }
  next();
}

function logoutUser(req, res) {
  res.clearCookie('usercookie').redirect('/');
}

async function loginUser(req, res) {
  try {
    await loginValidator.validate(req.body);
  } catch {
    res.status(400).end();
  }

  const hashedPassword = await dbm.getHashedPassword(req.body.username);
  if (hashedPassword === null) {
    res.status(400).end();
    return;
  }

  bcrypt.compare(req.body.password, hashedPassword, (err, result) => {
    if (err) {
      res.redirect('/errorpage.html');
      return;
    }
    if (result) {
      const token = cookieMgr.createCookie({ username: req.body.username });
      res.cookie('usercookie', token, { httpOnly: true }).status(200).end();
    } else {
      res.status(400).end();
    }
  });
}

async function registerUser(req, res) {
  let hashedPassword;
  try {
    await registerValidator.validate(req.body);
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch {
    res.status(400).end();
    return;
  }

  try {
    await dbm.createUser(req.body, hashedPassword);
    const token = cookieMgr.createCookie({ username: req.body.username });
    res.cookie('usercookie', token, { httpOnly: true }).status(200).end();
  } catch {
    res.status(403).end();
  }
}

export default {
  approveSubmission,
  loginUser,
  logoutUser,
  registerUser,
};
