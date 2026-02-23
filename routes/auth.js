const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const Room = require('../models/Room');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);
router.get('/logout', authController.logout);

router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role === 'admin') {
        return res.redirect('/dashboard');
    }
    res.redirect('/home');
});

router.get('/home', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const rooms = await Room.find({ available: true }).lean();

        // Fetch reviews for each room and calculate average
        const roomsWithRatings = await Promise.all(rooms.map(async (room) => {
            const reviews = await Review.find({ room: room._id }).populate('user', 'name').sort({ createdAt: -1 });
            const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
                : 0;
            return { ...room, reviews, avgRating, totalReviews: reviews.length };
        }));

        res.render('home', { session: req.session, rooms: roomsWithRatings });
    } catch (err) {
        console.error(err);
        res.render('home', { session: req.session, rooms: [] });
    }
});

const Review = require('../models/Review');

router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({ available: true }).lean();

        // Fetch reviews for each room and calculate average
        const roomsWithRatings = await Promise.all(rooms.map(async (room) => {
            const reviews = await Review.find({ room: room._id }).populate('user', 'name').sort({ createdAt: -1 });
            const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
                : 0;
            return { ...room, reviews, avgRating, totalReviews: reviews.length };
        }));

        res.render('rooms', { session: req.session, rooms: roomsWithRatings });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching rooms');
    }
});

router.post('/review', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { roomId, rating, comment } = req.body;
    try {
        const newReview = new Review({
            user: req.session.user._id,
            room: roomId,
            rating: parseInt(rating),
            comment
        });
        await newReview.save();
        res.redirect('/rooms');
    } catch (err) {
        console.error(err);
        res.redirect('/rooms');
    }
});

const bookingController = require('../controllers/bookingController');

router.post('/book', bookingController.bookRoom);

// Guest Routes
router.get('/guests', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('guests', { session: req.session });
});

router.get('/my-booking', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const Booking = require('../models/Booking');
        // Fetch the most recent booking for the user
        const latestBooking = await Booking.findOne({ guest: req.session.user._id }).sort({ createdAt: -1 });

        let bookingData = null;
        if (latestBooking) {
            // Find room details if needed, for now using saved data
            const Room = require('../models/Room');
            const room = await Room.findById(latestBooking.room);

            bookingData = {
                _id: latestBooking._id,
                bookingId: latestBooking.bookingId || latestBooking._id.toString().slice(-6).toUpperCase(),
                roomNumber: room ? room.number : 'N/A',
                roomType: latestBooking.type,
                floor: room ? room.floor : '1',
                nights: latestBooking.nights,
                checkIn: new Date(latestBooking.checkIn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                checkOut: new Date(latestBooking.checkOut).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                pricePerNight: Math.round(latestBooking.amount / latestBooking.nights),
                total: latestBooking.amount,
                status: latestBooking.status,
                amenities: ['WiFi', 'TV', 'Mini Bar', 'Room Service'],
                specialRequests: 'None',
                roomId: room ? room._id : null
            };
        }

        res.render('my-booking', { session: req.session, booking: bookingData });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching booking');
    }
});

router.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role === 'admin') {
        res.render('profile_admin', { session: req.session, user: req.session.user });
    } else {
        res.render('profile_guest', { session: req.session, user: req.session.user });
    }
});

router.get('/booking-history', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('booking-history', { session: req.session });
});

router.get('/settings', dashboardController.getSettings);

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.get('/change-password', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('change-password', { user: req.session.user });
});

module.exports = router;
