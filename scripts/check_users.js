const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUserEmails() {
    try {
        await require('../db/db');
        const User = require('../models/User');

        console.log('--- User Email Check ---');
        const users = await User.find().lean();

        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach(u => {
                console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
            });
        }

        console.log('\n--- End of Report ---');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUserEmails();
