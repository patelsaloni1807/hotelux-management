const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String, // Kept for backward compatibility if needed, though email is now primary
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    phone: String,
    nationality: String,
    role: { type: String, enum: ['guest', 'admin'], default: 'guest' },
    isAdmin: { type: Boolean, default: false }, // Kept for backward compatibility
    memberSince: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
