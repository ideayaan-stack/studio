
// Standalone script to test Brevo SMTP
// Run with: node test-brevo.js

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testBrevo() {
    console.log('Testing Brevo SMTP...');
    console.log('User:', process.env.BREVO_SMTP_USER);

    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
        console.error('ERROR: Missing credentials in .env.local');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_KEY,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: '"Ideayaan Test" <noreply@ideayaan.com>',
            to: 'sarvy2503@gmail.com',
            subject: 'Brevo SMTP Test',
            text: 'If you receive this, Brevo SMTP is working correctly!',
            html: '<b>If you receive this, Brevo SMTP is working correctly!</b>',
        });

        console.log('Message sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testBrevo();
