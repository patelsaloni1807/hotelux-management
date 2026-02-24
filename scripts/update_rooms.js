const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Room = require('../models/Room');

async function updateRoomCounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotelux');

        // Update Deluxe Rooms
        const deluxeRoom = await Room.findOne({ type: 'Deluxe' });
        if (deluxeRoom) {
            const roomNumbers = [];
            for (let i = 1; i <= 10; i++) {
                roomNumbers.push({ number: (100 + i).toString(), status: 'Available' });
            }
            deluxeRoom.roomNumbers = roomNumbers;
            await deluxeRoom.save();
            console.log('✅ Deluxe rooms updated to 10');
        } else {
            console.log('⚠️ Deluxe room category not found');
        }

        // Update Standard Rooms
        const standardRoom = await Room.findOne({ type: 'Standard' });
        if (standardRoom) {
            const roomNumbers = [];
            for (let i = 1; i <= 15; i++) {
                roomNumbers.push({ number: (200 + i).toString(), status: 'Available' });
            }
            standardRoom.roomNumbers = roomNumbers;
            await standardRoom.save();
            console.log('✅ Standard rooms updated to 15');
        } else {
            console.log('⚠️ Standard room category not found');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating rooms:', err);
        process.exit(1);
    }
}

updateRoomCounts();
