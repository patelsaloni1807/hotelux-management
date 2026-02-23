const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomNumber: { type: String }, // Storing number for display ease
    type: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Checked In', 'Reserved', 'Checked Out', 'Cancelled'], default: 'Reserved' },
    bookingId: { type: String } // Added custom ID field if needed
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
