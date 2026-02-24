const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Room = require('../models/Room');
const Booking = require('../models/Booking');

async function debugAvailability() {
    try {
        await require('../db/db');
        console.log('--- Detailed Diagnostic Report ---');

        const now = new Date();
        console.log(`Current Server Time: ${now.toISOString()} (${now.toLocaleString()})`);

        const bookings = await Booking.find({ status: { $in: ['Reserved', 'Checked In'] } }).populate('room');
        console.log(`\nFound ${bookings.length} active/reserved bookings in total.`);

        bookings.forEach(b => {
            console.log(`\nBooking ID: ${b._id}`);
            console.log(`- Room Type: ${b.room ? b.room.type : 'Unknown'}`);
            console.log(`- Status: ${b.status}`);
            console.log(`- Check-In:  ${b.checkIn.toISOString()} (${b.checkIn.toLocaleString()})`);
            console.log(`- Check-Out: ${b.checkOut.toISOString()} (${b.checkOut.toLocaleString()})`);

            const isOverlap = b.checkIn <= now && b.checkOut > now;
            console.log(`- Overlaps with NOW? ${isOverlap ? 'YES ✅' : 'NO ❌'}`);
        });

        const rooms = await Room.find().lean();
        console.log('\n--- ROOM SUMMARY ---');
        rooms.forEach(r => {
            const totalUnits = r.roomNumbers ? r.roomNumbers.length : 0;
            console.log(`${r.type}: Total ${totalUnits} units`);
        });

        console.log('\n--- End of Report ---');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debugAvailability();
