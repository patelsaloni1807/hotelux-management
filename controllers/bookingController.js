const Booking = require('../models/Booking');
const Room = require('../models/Room');

exports.bookRoom = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { roomId, checkIn, checkOut } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).send('Room not found');
        }

        // Calculate nights and total price
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            // Handle invalid dates
            return res.redirect('/rooms'); // Or show error
        }

        const totalPrice = room.price * nights;

        const newBooking = new Booking({
            guest: req.session.user._id,
            room: room._id,
            roomNumber: room.number, // Added in fix
            type: room.type,
            checkIn: start,
            checkOut: end,
            nights: nights,
            amount: totalPrice,
            status: 'Reserved',
            bookingId: 'BK' + Math.random().toString(36).substr(2, 6).toUpperCase() // Added in fix
        });

        await newBooking.save();

        res.redirect('/dashboard/my-booking'); // Redirect to user's booking page
    } catch (err) {
        console.error(err);
        res.redirect('/rooms');
    }
};

exports.myBookings = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const booking = await Booking.findOne({
            guest: req.session.user._id
        }).sort({ createdAt: -1 }).populate('room');

        let bookingData = null;
        if (booking && booking.room) {
            bookingData = {
                _id: booking._id,
                bookingId: booking.bookingId || booking._id.toString().substring(0, 6).toUpperCase(),
                roomNumber: booking.room.number,
                roomType: booking.type,
                floor: booking.room.floor || '1',
                nights: booking.nights,
                checkIn: new Date(booking.checkIn).toLocaleDateString(),
                checkOut: new Date(booking.checkOut).toLocaleDateString(),
                pricePerNight: Math.round(booking.amount / booking.nights),
                total: booking.amount,
                status: booking.status,
                amenities: ['WiFi', 'TV', 'AC', 'Breakfast'],
                specialRequests: 'None',
                roomId: booking.room._id
            };
        }

        res.render('my-booking', {
            booking: bookingData,
            user: req.session.user,
            session: req.session // Added in fix
        });
    } catch (err) {
        console.error(err);
        res.render('my-booking', { booking: null, error: 'Could not fetch booking.' });
    }
};

exports.cancelBooking = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: 'Cancelled' });
        res.redirect('/dashboard/my-booking');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/my-booking');
    }
};
