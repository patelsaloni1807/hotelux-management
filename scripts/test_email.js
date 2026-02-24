const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
    console.log('--- Email Connection Test ---');
    console.log(`Using Email: ${process.env.EMAIL_USER}`);
    console.log(`Using Password: ${process.env.EMAIL_PASS ? '******** (Hidden)' : 'NOT SET'}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Error: EMAIL_USER or EMAIL_PASS is missing in your .env file.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        console.log('Attempting to connect to Gmail...');
        await transporter.verify();
        console.log('✅ Success! Your email credentials are correct.');

        console.log('Sending a test email...');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'HOTELUX - Email Configuration Test',
            text: 'If you are reading this, your email configuration is working perfectly!'
        });
        console.log('✅ Test email sent successfully to yourself.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'EAUTH') {
            console.error('\n❌ AUTHENTICATION FAILED (Error 535):');
            console.error('This means Gmail rejected your login.');
            console.error('\nADVICE:');
            console.error('1. You CANNOT use your regular Gmail password.');
            console.error('2. You MUST enable 2-Step Verification in your Google Account.');
            console.error('3. You MUST generate a 16-character "App Password".');
            console.error('\nFollow this link to generate it: https://myaccount.google.com/apppasswords');
        } else {
            console.error('❌ An unexpected error occurred:', err);
        }
        process.exit(1);
    }
}

testEmail();
