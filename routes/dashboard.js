const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const dashboardController = require('../controllers/dashboardController');

const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', dashboardController.getDashboard);

router.get('/guests', dashboardController.getGuests);
router.get('/rooms', dashboardController.getRooms);
router.get('/bookings', dashboardController.getBookings);

router.get('/profile', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'guest') return res.redirect('/login');
    res.render('profile');
});

router.get('/my-booking', bookingController.myBookings);
router.get('/booking/cancel/:id', bookingController.cancelBooking);

// Room CRUD Routes
router.get('/rooms/add', dashboardController.getAddRoom);
router.post('/rooms/add', upload.single('image'), dashboardController.postAddRoom);
router.get('/rooms/edit/:id', dashboardController.getEditRoom);
router.post('/rooms/edit/:id', upload.single('image'), dashboardController.postEditRoom);
router.post('/rooms/delete/:id', dashboardController.deleteRoom);

router.get('/booking-history', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'guest') return res.redirect('/login');
    res.render('booking-history');
});

module.exports = router;
