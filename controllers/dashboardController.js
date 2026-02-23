const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role === 'admin') {
        // Admin stats
        const totalRooms = await Room.countDocuments();
        const activeBookings = await Booking.countDocuments({ status: { $in: ['Checked In', 'Reserved'] } });
        const totalGuests = await User.countDocuments({ role: 'guest' });
        const recentBookings = await Booking.find().sort({ checkIn: -1 }).limit(5).populate('guest');
        const revenue = await Booking.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);

        // Calculate room status counts for chart
        const rooms = await Room.find();
        const occupiedCount = rooms.filter(r => !r.available).length;
        const availableCount = rooms.filter(r => r.available).length;
        // Assuming maintenance isn't tracked yet, but adding placeholder
        const maintenanceCount = 0;

        res.render('dashboard_admin', {
            totalRooms,
            activeBookings,
            totalGuests,
            revenue: revenue[0] ? revenue[0].total : 0,
            recentBookings,
            roomStats: { occupied: occupiedCount, available: availableCount, maintenance: maintenanceCount }
        });
    } else {
        // Guest stats
        const bookings = await Booking.find({ guest: req.session.user._id }).sort({ checkIn: -1 });
        res.render('dashboard_guest', { bookings });
    }
};

exports.getGuests = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');

    const guests = await User.find({ role: 'guest' });

    // Fetch latest booking status for each guest
    const guestsWithStatus = await Promise.all(guests.map(async (guest, index) => {
        const latestBooking = await Booking.findOne({ guest: guest._id }).sort({ checkIn: -1 });
        return {
            ...guest.toObject(),
            guestId: `G00${index + 1}`, // Generate Guest ID like G001
            status: latestBooking ? latestBooking.status : 'Inactive', // Default to Inactive if no booking
            bookingId: latestBooking ? latestBooking._id : null
        };
    }));

    res.render('guests_admin', { guests: guestsWithStatus });
};

exports.getRooms = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    const rooms = await Room.find();
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.available).length;
    const occupiedRooms = totalRooms - availableRooms;
    res.render('rooms_admin', { rooms, totalRooms, availableRooms, occupiedRooms });
};

// Add Room - GET
exports.getAddRoom = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    res.render('room_form', { room: null });
};

// Add Room - POST
exports.postAddRoom = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    const { number, type, price, available } = req.body;
    let image = null;
    if (req.file) {
        const base64Image = req.file.buffer.toString('base64');
        image = `data:${req.file.mimetype};base64,${base64Image}`;
    }

    try {
        const newRoom = new Room({
            number,
            type,
            price,
            available: available === 'true',
            image
        });
        await newRoom.save();
        res.redirect('/dashboard/rooms');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/rooms/add');
    }
};

// Edit Room - GET
exports.getEditRoom = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        const room = await Room.findById(req.params.id);
        res.render('room_form', { room });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/rooms');
    }
};

// Edit Room - POST
exports.postEditRoom = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    const { number, type, price, available } = req.body;
    const updateData = {
        number,
        type,
        price,
        available: available === 'true'
    };

    if (req.file) {
        const base64Image = req.file.buffer.toString('base64');
        updateData.image = `data:${req.file.mimetype};base64,${base64Image}`;
    }

    try {
        await Room.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/dashboard/rooms');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/rooms');
    }
};

// Delete Room - POST
exports.deleteRoom = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    try {
        await Room.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard/rooms');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/rooms');
    }
};

exports.getBookings = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    const bookings = await Booking.find().populate('guest').populate('room'); // Added .populate('room') in fix
    res.render('bookings_admin', { bookings });
};

exports.getSettings = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    res.render('settings', { user: req.session.user });
};
