'use server';

import { sendEmailViaBrevo } from '@/lib/brevo';

interface EmailActionParams {
    to_email: string;
    to_name: string;
    subject: string;
    message: string; // This will be the HTML content
}

export async function sendEmailAction(params: EmailActionParams) {
    try {
        const result = await sendEmailViaBrevo({
            to: params.to_email,
            name: params.to_name,
            subject: params.subject,
            htmlContent: params.message,
        });

        return result;
    } catch (error: any) {
        console.error('Server Action Email Error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}
