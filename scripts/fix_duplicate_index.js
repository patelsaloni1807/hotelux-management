const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotelux');
        const db = mongoose.connection.db;
        const collection = db.collection('rooms');

        console.log('Checking indexes on "rooms" collection...');
        const indexes = await collection.listIndexes().toArray();
        console.log('Found indexes:', indexes.map(i => i.name));

        if (indexes.find(i => i.name === 'number_1')) {
            console.log('Dropping index "number_1"...');
            await collection.dropIndex('number_1');
            console.log('✅ Index "number_1" dropped successfully.');
        } else {
            console.log('ℹ️ Index "number_1" not found. It might have been already removed or had a different name.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing index:', err);
        process.exit(1);
    }
}

fixIndex();
