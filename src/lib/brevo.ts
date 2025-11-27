import * as Brevo from '@getbrevo/brevo';

interface SendEmailParams {
    to: string;
    name: string;
    subject: string;
    htmlContent: string;
}

export async function sendEmailViaBrevo({ to, name, subject, htmlContent }: SendEmailParams) {
    const apiKey = process.env.BREVO_SMTP_KEY; // Using the key from env, assuming it's an API key now if using SDK
    const senderEmail = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'noreply@ideayaan.com';
    const senderName = process.env.NEXT_PUBLIC_SENDER_NAME || 'Ideayaan Studio';

    if (!apiKey) {
        throw new Error('Brevo API key is not configured. Please check BREVO_SMTP_KEY in .env.local');
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to, name: name }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Message sent successfully. Message ID:', data.body.messageId);
        return { success: true, messageId: data.body.messageId };
    } catch (error: any) {
        console.error('Error sending email via Brevo SDK:', error);
        return { success: false, error: error.body ? JSON.stringify(error.body) : error.message };
    }
}
