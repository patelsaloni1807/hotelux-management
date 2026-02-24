const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Room = require('../models/Room');

async function checkRooms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotelux');
        const rooms = await Room.find({});
        console.log('Current Rooms in Database:');
        rooms.forEach(r => {
            console.log(`- Type: ${r.type}, Price: ${r.price}, Room Count: ${r.roomNumbers ? r.roomNumbers.length : 0}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkRooms();
