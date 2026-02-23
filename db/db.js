const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotelux';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB connected successfully to', mongoURI.includes('@') ? 'Remote DB' : 'Local DB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('💡 Tip: Ensure your MongoDB service is running. On Windows, use "Start-Service -Name MongoDB" in PowerShell.');
    });

module.exports = mongoose;