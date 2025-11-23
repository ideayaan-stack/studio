import { Platform } from 'react-native';

// NOTE: To use EmailJS, you need to sign up at https://www.emailjs.com/
// and replace these placeholders with your actual Service ID, Template ID, and Public Key.
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

interface EmailParams {
    to_email: string;
    to_name: string;
    subject: string;
    message: string;
    [key: string]: any;
}

export const sendEmail = async (params: EmailParams) => {
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
        console.log('[EmailJS] Mock Send:', params);
        return;
    }

    const data = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: params,
    };

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`EmailJS Error: ${response.status} ${await response.text()}`);
        }
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

export const sendTaskAssignmentEmail = async (toEmail: string, toName: string, taskTitle: string, deadline: string) => {
    await sendEmail({
        to_email: toEmail,
        to_name: toName,
        subject: `New Task Assigned: ${taskTitle}`,
        message: `You have been assigned a new task: "${taskTitle}".\nDeadline: ${deadline}.\nPlease check the Ideayaan app for details.`,
    });
};
