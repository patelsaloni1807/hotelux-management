const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

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
        const now = new Date();

        // Calculate real-time availability for each room category
        const roomsWithRatings = await Promise.all(rooms.map(async (room) => {
            // Find ALL active bookings for this room category
            // We count all 'Reserved' and 'Checked In' to reflect inventory reduction
            const activeBookings = await Booking.countDocuments({
                room: room._id,
                status: { $in: ['Reserved', 'Checked In'] }
            });

            const totalUnits = room.roomNumbers ? room.roomNumbers.length : 0;
            const manualOccupied = room.roomNumbers ? room.roomNumbers.filter(rn => rn.status !== 'Available').length : 0;
            const availableUnits = Math.max(0, totalUnits - manualOccupied - activeBookings);

            const reviews = await Review.find({ room: room._id }).populate('user', 'name').sort({ createdAt: -1 });
            const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
                : 0;

            return { ...room, reviews, avgRating, totalReviews: reviews.length, availableUnits };
        }));

        res.render('home', { session: req.session, rooms: roomsWithRatings });
    } catch (err) {
        console.error(err);
        res.render('home', { session: req.session, rooms: [] });
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const { minPrice, maxPrice, ac, checkIn, checkOut } = req.query;
        let query = { available: true };

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        if (ac) {
            query.isAC = ac === 'true';
        }

        const rooms = await Room.find(query).lean();

        const startDate = (checkIn && checkIn.trim() !== '') ? new Date(checkIn) : null;
        const endDate = (checkOut && checkOut.trim() !== '') ? new Date(checkOut) : null;

        let totalAvailableCount = 0;

        const roomsWithRatings = await Promise.all(rooms.map(async (room) => {
            // Calculate active bookings for this category
            let activeBookingsCount = 0;

            // Only use overlap logic if BOTH dates are valid
            if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
                // If specific dates are searched, use overlap logic
                activeBookingsCount = await Booking.countDocuments({
                    room: room._id,
                    status: { $in: ['Reserved', 'Checked In'] },
                    $or: [{ checkIn: { $lt: endDate }, checkOut: { $gt: startDate } }]
                });
            } else {
                // Default: Count all active reservations (Inventory model)
                activeBookingsCount = await Booking.countDocuments({
                    room: room._id,
                    status: { $in: ['Reserved', 'Checked In'] }
                });
            }

            const totalUnits = room.roomNumbers ? room.roomNumbers.length : 0;
            const manualOccupied = room.roomNumbers ? room.roomNumbers.filter(rn => rn.status !== 'Available').length : 0;
            const availableUnits = Math.max(0, totalUnits - manualOccupied - activeBookingsCount);
            totalAvailableCount += availableUnits;

            const reviews = await Review.find({ room: room._id }).populate('user', 'name').sort({ createdAt: -1 });
            const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
                : 0;

            return { ...room, reviews, avgRating, totalReviews: reviews.length, availableUnits };
        }));

        res.render('rooms', {
            session: req.session,
            rooms: roomsWithRatings,
            filters: req.query,
            totalAvailable: totalAvailableCount
        });
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

router.get('/my-booking', (req, res) => res.redirect('/dashboard/my-booking'));

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
