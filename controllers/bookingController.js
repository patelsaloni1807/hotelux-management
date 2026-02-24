const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mailService = require('../utils/mailService');

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
            return res.redirect('/rooms');
        }

        const totalPrice = room.price * nights;

        // --- Automated Room Number Assignment Logic ---
        // 1. Find overlapping bookings for this room category
        const overlappingBookings = await Booking.find({
            room: roomId,
            status: { $in: ['Reserved', 'Checked In'] },
            $or: [
                { checkIn: { $lt: end }, checkOut: { $gt: start } }
            ]
        });

        // 2. Identify booked room numbers
        const bookedNumbers = overlappingBookings.map(b => b.roomNumber);

        // 3. Find first available room number from category's roomNumbers list
        let assignedRoomNumber = null;
        if (room.roomNumbers && room.roomNumbers.length > 0) {
            const availableNumber = room.roomNumbers.find(rn =>
                rn.status === 'Available' && !bookedNumbers.includes(rn.number)
            );

            if (availableNumber) {
                assignedRoomNumber = availableNumber.number;
            }
        }

        if (!assignedRoomNumber) {
            req.flash('error', 'Sorry, all rooms of this type are fully booked for these dates.');
            return res.redirect('/rooms');
        }

        const newBooking = new Booking({
            guest: req.session.user._id,
            room: room._id,
            roomNumber: assignedRoomNumber,
            type: room.type,
            checkIn: start,
            checkOut: end,
            nights: nights,
            amount: totalPrice,
            status: 'Reserved',
            bookingId: 'BK' + Math.random().toString(36).substr(2, 6).toUpperCase()
        });

        await newBooking.save();

        // Send email notification (non-blocking)
        mailService.sendBookingConfirmation(req.session.user, newBooking);

        res.redirect('/dashboard/my-booking');
    } catch (err) {
        console.error(err);
        res.redirect('/rooms');
    }
};

exports.myBookings = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const bookings = await Booking.find({
            guest: req.session.user._id
        }).sort({ createdAt: -1 }).populate('room');

        const bookingsData = bookings.map(booking => {
            if (!booking.room) return null;

            // Calculate if cancellation is allowed
            const now = new Date();
            const checkInDate = new Date(booking.checkIn);
            const timeDiff = checkInDate.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            const canCancel = hoursDiff >= 24;

            return {
                _id: booking._id,
                bookingId: booking.bookingId || booking._id.toString().substring(0, 6).toUpperCase(),
                roomNumber: booking.roomNumber,
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
                roomId: booking.room._id,
                canCancel: canCancel,
                isCheckout: booking.status === 'Checked Out' || now >= new Date(booking.checkOut)
            };
        }).filter(b => b !== null);

        res.render('my-booking', {
            bookings: bookingsData,
            user: req.session.user,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.render('my-booking', { booking: null, error: 'Could not fetch booking.' });
    }
};

exports.cancelBooking = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.redirect('/dashboard/my-booking');

        // Check if 24h rule is met
        const now = new Date();
        const checkInDate = new Date(booking.checkIn);
        const hoursDiff = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);

        if (hoursDiff < 24) {
            req.flash('error', 'Cancellation is only allowed up to 24 hours before check-in.');
            return res.redirect('/dashboard/my-booking');
        }

        booking.status = 'Cancelled';
        await booking.save();
        res.redirect('/dashboard/my-booking');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/my-booking');
    }
};

exports.updateStatus = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { id, status } = req.params;

    try {
        const booking = await Booking.findById(id);
        if (!booking) return res.redirect('/dashboard/bookings');

        // Allow Admin to set any status, Guest only allowed to 'Check Out'
        if (req.session.user.role === 'admin' || (status === 'Checked Out' && booking.status === 'Checked In')) {
            booking.status = status;
            await booking.save();
        }

        if (req.session.user.role === 'admin') {
            res.redirect('/dashboard/bookings');
        } else {
            res.redirect('/dashboard/my-booking');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
};
