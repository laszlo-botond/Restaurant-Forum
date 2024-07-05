import path from 'path';
import express from 'express';
import pgr from '../ejs/renderer.ejs.js';
import val from '../form_manager/validator.form.js';
import auth from './middleAuth.route.js';

const staticDir = path.join(process.cwd(), 'public');
const router = express.Router();

// authentication
router.get('/logout', auth.logoutUser);
router.post('/login', auth.loginUser);
router.post('/register', auth.registerUser);
router.use(['/submit_reservation', '/submit_creation', '/submit_pic'], auth.approveSubmission);

// GET of the 2 pages
router.get('/restaurant_details', pgr.sendDetailsPage);
router.get(['/', '/index', '/all_restaurants'], pgr.sendAllRestaurants);

// POST of the 3 forms
router.post('/submit_creation', val.verifyCreation);
router.post('/submit_reservation', val.verifyReservation);
router.post('/submit_pic', val.verifyPicSubmission);

router.post('/delete_reservation', val.verifyReservationDeletion);
router.post('/delete_past', val.verifyPastDeletion);
router.post('/approve_reservation', val.verifyReservationApproval);
router.post('/delete_all_pics', val.verifyPicDelete);
router.post('/delete_pic', val.verifyOnePicDelete);

router.get('/restaurant_query', pgr.sendFilteredRestaurants);

// fetch helpers
router.get('/get_extra_info', pgr.sendExtraDetails);

// error response code middleware
router.get('/errorpage.html', (req, res, next) => {
  res.status(400);
  next();
});
router.get('/no_auth.html', (req, res, next) => {
  res.status(401);
  next();
});
router.get('/forbidden.html', (req, res, next) => {
  res.status(403);
  next();
});

// express static middleware
router.use(express.static(staticDir));

export default router;
