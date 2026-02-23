const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    number: String,
    type: String,
    price: Number,
    available: { type: Boolean, default: true },
    image: String
});

module.exports = mongoose.model('Room', roomSchema);
