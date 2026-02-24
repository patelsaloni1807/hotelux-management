const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    type: String, // Category: Deluxe, Standard, etc.
    price: Number,
    available: { type: Boolean, default: true },
    isAC: { type: Boolean, default: true },
    description: String,
    bedType: { type: String, default: '1 extra-large double bed' },
    roomNumbers: [{
        number: String,
        status: { type: String, default: 'Available' } // Available, Occupied, Maintenance
    }],
    amenities: [String],
    image: String
});

module.exports = mongoose.model('Room', roomSchema);
