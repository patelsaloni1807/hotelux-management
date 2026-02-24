const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('--- Email Service Initializing ---');
console.log(`Using Email: ${process.env.EMAIL_USER}`);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // IMPORTANT for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Email Transporter Error:', error.message);
    } else {
        console.log('✅ Email Transporter is ready to send messages');
    }
});

exports.sendBookingConfirmation = async (user, booking) => {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not set. Skipping email notification.');
        return;
    }

    const mailOptions = {
        from: `"HOTELUX Reservations" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Booking Confirmed: #${booking.bookingId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1e293b; padding: 24px; text-align: center; color: white;">
                    <h1 style="margin: 0;">HOTELUX</h1>
                    <p style="margin: 8px 0 0; opacity: 0.8;">Your reservation is confirmed!</p>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #1e293b; margin-top: 0;">Hello ${user.name},</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                        Thank you for choosing Hotelux. Your booking has been successfully processed. Here are your reservation details:
                    </p>
                    
                    <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Booking ID:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">#${booking.bookingId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Room Type:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${booking.type}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Room Number:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${booking.roomNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Check-In:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${new Date(booking.checkIn).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Check-Out:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${new Date(booking.checkOut).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Total Amount:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">₹${booking.amount}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #475569;">You can view your full booking details and manage your reservation in your dashboard.</p>
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/dashboard/my-booking"
                           style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           View Details
                        </a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
                    © ${new Date().getFullYear()} Hotelux Management Systems. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        console.log(`Sending email to: ${user.email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Booking confirmation email sent!`);
        console.log(`- Recipient: ${user.email}`);
        console.log(`- MessageID: ${info.messageId}`);
        console.log(`- Response: ${info.response}`);
    } catch (err) {
        console.error('❌ Error sending booking confirmation email:', err.message);
    }
};
