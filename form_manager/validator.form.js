import fs from 'fs';
import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import dbm from '../db/dbmanager.db.js';
import pgr from '../ejs/renderer.ejs.js';
import cookieMgr from './cookiemanager.form.js';
import BBfile from './filehandler.form.js';

// set up vine validator
vine.convertEmptyStringsToNull = true;
const createSchema = vine.object({
  name: vine.string(),
  town: vine.string(),
  street: vine.string(),
  nr: vine.string().regex(/^[0-9]+$/),
  phone: vine.string().regex(/^\+?[0-9]+$/),
  open_hour: vine.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
  closing_hour: vine.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
});
vine.messagesProvider = new SimpleMessagesProvider({
  required: 'The {{ field }} field is required!',
  string: 'The value of {{ field }} field must be a string!',
  regex: 'Invalid format of the {{ field }} field!',
});
const validator = vine.compile(createSchema);

function isEmptyArg(argsObj) {
  let hasEmpty = false;
  const keys = Object.keys(argsObj);
  keys.forEach((key) => {
    const value = argsObj[key];
    if (value === null || value === undefined || value === '') {
      hasEmpty = true;
    }
  });

  // return if any are empty
  return hasEmpty;
}

function verifyDate(argsObj) {
  // check date validity
  const dateObj = new Date(argsObj.res_date);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }
  return true;
}

function verifyFutureDate(argsObj) {
  // get tomorrow's date
  const dateObj = new Date(argsObj.res_date);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  tomorrowDate.setHours(0, 0);
  // build reservation time
  const reservationTime = argsObj.res_time;
  dateObj.setHours(reservationTime.split(':')[0], reservationTime.split(':')[1]);
  // check if reservation date is in future (starting tomorrow)
  if (dateObj < tomorrowDate) {
    return false;
  }
  return true;
}

function verifyTimeFormat(argsObj) {
  // check time format HH:MM
  const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (argsObj.res_time.match(timeRegex) === null) {
    return false;
  }
  return true;
}

async function verifyOpenTime(argsObj) {
  const restaurant = await dbm.getRestaurantByID(argsObj.id);
  const openHour = restaurant.OpenHour;
  const closingHour = restaurant.ClosingHour;
  if (argsObj.res_time < openHour || argsObj.res_time > closingHour) {
    return false;
  }
  return true;
}

// exports

async function verifyReservation(req, res) {
  try {
    const argsObj = req.body;
    argsObj.username = cookieMgr.getUserName(req.cookies.usercookie);

    if (isEmptyArg(argsObj) === true) {
      pgr.sendWrongID(res);
      return;
    }

    // check if restaurant exists
    const restaurant = await dbm.getRestaurantByID(argsObj.id);
    if (typeof restaurant === 'undefined') {
      pgr.sendWrongID(res);
      return;
    }

    // check date format
    if (verifyDate(argsObj, res) === false) {
      pgr.sendWrongReservation(req, res, 'Incorrect date format!');
      return;
    }

    // check if date is in future
    if (verifyFutureDate(argsObj) === false) {
      pgr.sendWrongReservation(req, res, 'Reservation must be at least one day ahead!');
      return;
    }

    // check time format
    if (verifyTimeFormat(argsObj) === false) {
      pgr.sendWrongReservation(req, res, 'Incorrect time format!');
      return;
    }

    const okTime = await verifyOpenTime(argsObj);
    if (okTime === false) {
      pgr.sendWrongReservation(req, res, "Restaurant isn't open at that time!");
      return;
    }

    await dbm.createReservation(argsObj);
    res.status(200).redirect(`/restaurant_details?id=${argsObj.id}`);
  } catch {
    pgr.sendWrongID(res);
  }
}

async function generateID(argsObj) {
  const restaurants = await dbm.getBasicRestaurants();
  const random = 1000 + Math.floor(Math.random() * 999);
  const id = `${random}${restaurants.length + 1}`;
  argsObj.id = id;
}

async function verifyCreation(req, res) {
  try {
    const argsObj = req.body;

    try {
      await validator.validate(argsObj); // validate format
    } catch (e) {
      const errorMsg = e.messages[0].message;
      pgr.sendWrongCreation(res, errorMsg);
      return;
    }

    // opening hour needs to be earlier than closing hour
    if (argsObj.open_hour >= argsObj.closing_hour) {
      pgr.sendWrongCreation(res, 'Opening hour has to be earlier than closing hour!');
      return;
    }
    await generateID(argsObj); // also appends to argsObj

    try {
      argsObj.username = cookieMgr.getUserName(req.cookies.usercookie);
      await dbm.createRestaurant(argsObj);
    } catch {
      pgr.sendWrongCreation(res, 'Restaurant name is already taken!');
      return;
    }

    res.status(200).redirect('/index');
  } catch {
    pgr.sendWrongID(res);
  }
}

function verifyPicSubmission(req, res) {
  try {
    const bbfile = new BBfile(req, res);
    bbfile.uploadFile();
  } catch {
    pgr.sendWrongID(res);
  }
}

async function verifyReservationDeletion(req, res) {
  try {
    if (!req.cookies.usercookie) {
      res.status(401).end();
      return;
    }
    if (!req.body.id) {
      res.status(400).end();
      return;
    }
    const username = cookieMgr.getUserName(req.cookies.usercookie);
    const resCode = await dbm.checkReservationID(username, req.body.id);
    if (resCode !== 200) {
      res.status(resCode).end();
      return;
    }
    await dbm.deleteReservation(req.body);
    res.status(200).end();
  } catch {
    res.status(400).end();
  }
}

async function verifyReservationApproval(req, res) {
  try {
    if (!req.cookies.usercookie) {
      res.status(401).end();
      return;
    }
    if (!req.body.id) {
      res.status(400).end();
      return;
    }
    const username = cookieMgr.getUserName(req.cookies.usercookie);
    const resCode = await dbm.checkReservationsRestaurantOwnership(username, req.body.id);
    if (resCode !== 200) {
      res.status(resCode).end();
      return;
    }
    await dbm.approveReservation(req.body);
    res.status(200).end();
  } catch {
    res.status(400).end();
  }
}

async function verifyPastDeletion(req, res) {
  try {
    if (!req.cookies.usercookie) {
      res.status(401).end();
      return;
    }
    if (!req.body.restaurantID) {
      res.status(400).end();
      return;
    }
    const username = cookieMgr.getUserName(req.cookies.usercookie);
    const resCode = await dbm.checkRestaurantOwnership(username, req.body.restaurantID);
    if (resCode !== 200) {
      res.status(resCode).end();
      return;
    }

    await dbm.deletePast(req.body);
    res.status(200).end();
  } catch {
    res.status(400).end();
  }
}

async function verifyPicDelete(req, res) {
  try {
    if (!req.cookies.usercookie) {
      res.status(401).end();
      return;
    }
    if (!req.body.restaurantID) {
      res.status(400).end();
      return;
    }

    const username = cookieMgr.getUserName(req.cookies.usercookie);
    const resCode = await dbm.checkRestaurantOwnership(username, req.body.restaurantID);
    if (resCode !== 200) {
      res.status(resCode).end();
      return;
    }

    const toBeDeleted = await dbm.processAllPics(req.body, 'SELECT *');
    if (toBeDeleted === null) {
      throw new Error('Error at picture deletion');
    }

    // delete files
    await toBeDeleted.forEach((e) => {
      fs.unlinkSync(`./public/uploads/${e.PicName}`);
    });

    await dbm.processAllPics(req.body, 'DELETE');

    res.status(200).end();
  } catch {
    res.status(400).end();
  }
}

async function verifyOnePicDelete(req, res) {
  try {
    if (!req.cookies.usercookie) {
      res.status(401).end();
      return;
    }
    if (!req.body.picName) {
      res.status(400).end();
      return;
    }

    const username = cookieMgr.getUserName(req.cookies.usercookie);

    const parts = req.body.picName.split('/');
    const picName = parts[parts.length - 1];
    const picObj = await dbm.getPicByName(picName);
    if (picObj === null) {
      res.status(400).end();
      return;
    }
    if (picObj[0].OwnerName !== username) {
      res.status(403).end();
      return;
    }

    fs.unlinkSync(`./public/uploads/${picName}`);
    await dbm.deletePicByName(picName);
    res.status(200).end();
  } catch {
    res.status(400).end();
  }
}

export default {
  verifyCreation,
  verifyReservation,
  verifyPicSubmission,
  verifyReservationDeletion,
  verifyReservationApproval,
  verifyPastDeletion,
  verifyPicDelete,
  verifyOnePicDelete,
};
