import nodemailer from 'nodemailer';

interface SendEmailParams {
    to: string;
    name: string;
    subject: string;
    htmlContent: string;
}

export async function sendEmailViaBrevo({ to, name, subject, htmlContent }: SendEmailParams) {
    const smtpUser = process.env.BREVO_SMTP_USER;
    const smtpPass = process.env.BREVO_SMTP_KEY;
    const senderEmail = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'noreply@ideayaan.com';
    const senderName = process.env.NEXT_PUBLIC_SENDER_NAME || 'Ideayaan Studio';

    if (!smtpUser || !smtpPass) {
        throw new Error('Brevo SMTP credentials are not configured. Please check BREVO_SMTP_USER and BREVO_SMTP_KEY in .env.local');
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: `"${name}" <${to}>`,
            subject: subject,
            html: htmlContent,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Error sending email via Brevo:', error);
        return { success: false, error: error.message };
    }
}
