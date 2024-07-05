import jwt from 'jsonwebtoken';
import dbm from '../db/dbmanager.db.js';

const secret = 'SSA8MyB3ZWIgcHJvZ3JhbW1pbmc';

async function detailsOfRestaurant(ID) {
  const restaurant = await dbm.getRestaurantByID(ID); // for name
  const reservations = await dbm.getRestaurantReservations(ID); // for reservation list
  const pictures = await dbm.getRestaurantPictures(ID); // for picture list
  const usernames = await dbm.getUsernames(); // for reservation form options

  return {
    usernames,
    restaurant,
    reservations,
    pictures,
  };
}

async function allRestaurants() {
  const queryResults = await dbm.getBasicRestaurants(); // for restaurant list

  return { restaurants: queryResults };
}

async function filterRestaurants(req) {
  const queryResults = await dbm.getFilteredBasicRestaurants(req.query);

  return { restaurants: queryResults };
}

async function addCookieToModel(model, req) {
  const userCookie = req.cookies.usercookie;
  if (userCookie) {
    await jwt.verify(userCookie, secret, async (err, payload) => {
      if (payload.username) {
        // JWT successfully verified
        model.username = payload.username;
        model.ownReservationIDs = await dbm.getOwnRestaurantReservationIDs(payload.username);
      }
    });
  }
}

// exported functions below

async function sendDetailsPage(req, res) {
  const model = await detailsOfRestaurant(req.query.id);
  await addCookieToModel(model, req);
  if (model.restaurant === undefined) {
    res.redirect('/errorpage.html');
    return;
  }
  res.status(200).render('restaurant_details', model);
}

async function sendAllRestaurants(req, res) {
  const model = await allRestaurants();
  await addCookieToModel(model, req);
  res.status(200).render('all_restaurants', model);
}

function sendWrongID(res) {
  res.redirect('/errorpage.html');
}

async function sendWrongReservation(req, res, errorMsg) {
  const model = await detailsOfRestaurant(req.body.id);
  await addCookieToModel(model, req);
  model.reservationError = errorMsg;
  res.status(400).render('restaurant_details', model);
}

async function sendWrongCreation(res, errorMsg) {
  const model = await allRestaurants();
  model.restaurantError = errorMsg;
  res.status(400).render('all_restaurants', model);
}

async function sendExtraDetails(req, res) {
  if (typeof req.query.id === 'undefined') {
    res.status(400).end();
    return;
  }

  const [details] = await dbm.getRestaurantFullInfo(req.query.id);
  if (typeof details === 'undefined') {
    res.status(400).end();
    return;
  }

  res.status(200).json(details);
}

async function sendFilteredRestaurants(req, res) {
  const model = await filterRestaurants(req);
  await addCookieToModel(model, req);
  res.status(200).render('all_restaurants', model);
}

export default {
  sendDetailsPage,
  sendAllRestaurants,
  sendWrongID,
  sendWrongReservation,
  sendWrongCreation,
  sendExtraDetails,
  sendFilteredRestaurants,
};
