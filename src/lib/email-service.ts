import {
  getWelcomeEmailHtml,
  getTaskAssignmentEmailHtml,
  getDailyReminderEmailHtml,
  getFileUploadEmailHtml
} from './email-templates';

/**
 * EmailJS integration for email notifications
 * Free tier: 200 emails/month
 * 
 * Setup:
 * 1. Sign up at emailjs.com (free account)
 * 2. Create email service (Gmail/Outlook)
 * 3. Create email template
 * 4. Get Service ID, Template ID, and Public Key
 * 5. Add to .env.local as:
 *    - NEXT_PUBLIC_EMAILJS_SERVICE_ID
 *    - NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
 *    - NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
 */

/**
 * Initialize EmailJS configuration on the client side
 * This should be called once when the app loads to ensure EmailJS is properly configured
 */
export function initializeEmailJS(): void {
  if (typeof window === 'undefined') {
    return; // Only run on client side
  }

  try {
    // Store EmailJS config in window object for safe access
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (serviceId && templateId && publicKey) {
      (window as any).NEXT_PUBLIC_EMAILJS_SERVICE_ID = serviceId;
      (window as any).NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = templateId;
      (window as any).NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = publicKey;

      console.log('EmailJS configuration initialized');
    } else {
      console.warn('EmailJS configuration not found in environment variables');
    }
  } catch (error) {
    console.error('Failed to initialize EmailJS configuration:', error);
  }
}

export interface EmailOptions {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  task_title?: string;
  task_deadline?: string;
  assigner_name?: string;
  role?: string;
  team_name?: string;
  task_count?: number;
  task_list_summary?: string;
  uploader_name?: string;
  file_name?: string;
  file_url?: string;
}

/**
 * Send email via EmailJS
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input parameters
    if (!options.to_email || !options.to_name || !options.subject) {
      return {
        success: false,
        error: 'Missing required email parameters: to_email, to_name, or subject',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.to_email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Access environment variables safely for both client and server contexts
    const serviceId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID : undefined;
    const templateId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID : undefined;
    const publicKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY : undefined;

    // Try to get from window object if available (client-side)
    const finalServiceId = serviceId || (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_EMAILJS_SERVICE_ID : undefined);
    const finalTemplateId = templateId || (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_EMAILJS_TEMPLATE_ID : undefined);
    const finalPublicKey = publicKey || (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_EMAILJS_PUBLIC_KEY : undefined);

    if (!finalServiceId || !finalTemplateId || !finalPublicKey) {
      return {
        success: false,
        error: 'EmailJS not configured. Please add EmailJS credentials to .env.local',
      };
    }

    // Dynamically import emailjs with better error handling
    let emailjs;
    try {
      const emailjsModule = await import('@emailjs/browser');
      emailjs = emailjsModule;
    } catch (importError) {
      console.error('Failed to import @emailjs/browser:', importError);
      return {
        success: false,
        error: 'Failed to load EmailJS library. Please ensure @emailjs/browser is installed.',
      };
    }

    if (!emailjs || !emailjs.send) {
      return {
        success: false,
        error: 'EmailJS library not properly loaded',
      };
    }

    const templateParams = {
      to_email: options.to_email,
      to_name: options.to_name,
      subject: options.subject,
      message: options.message || '',
      task_title: options.task_title || '',
      task_deadline: options.task_deadline || '',
      assigner_name: options.assigner_name || '',
      role: options.role || '',
      team_name: options.team_name || '',
      task_count: options.task_count || 0,
      task_list_summary: options.task_list_summary || '',
      uploader_name: options.uploader_name || '',
      file_name: options.file_name || '',
      file_url: options.file_url || '',
    };

    console.log('Sending email with params:', templateParams);

    // Send email with timeout and better error handling
    const sendPromise = emailjs.send(finalServiceId, finalTemplateId, templateParams, {
      publicKey: finalPublicKey,
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email sending timeout')), 10000)
    );

    await Promise.race([sendPromise, timeoutPromise]);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.message) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Email sending timed out. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error while sending email. Please check your connection.';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Email service authentication failed. Please check your EmailJS configuration.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}


/**
 * Send task assignment email
 */
export async function sendTaskAssignmentEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  taskDeadline: string,
  assignerName: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Generate beautiful HTML content
  const htmlContent = getTaskAssignmentEmailHtml(toName, taskTitle, taskDeadline, assignerName, message);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `New Task Assigned: ${taskTitle}`,
    message: htmlContent, // Send full HTML as message
    task_title: taskTitle,
    task_deadline: taskDeadline,
    assigner_name: assignerName,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  toEmail: string,
  toName: string,
  role: string,
  teamName: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = getWelcomeEmailHtml(toName, toEmail, role, teamName);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: 'Welcome to Ideayaan Studio!',
    message: htmlContent,
    role: role,
    team_name: teamName,
  });
}

/**
 * Send daily reminder email
 */
export async function sendDailyReminderEmail(
  toEmail: string,
  toName: string,
  taskCount: number,
  taskListSummary: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = getDailyReminderEmailHtml(toName, taskCount, taskListSummary);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `📅 Daily Briefing: ${taskCount} Pending Tasks`,
    message: htmlContent,
    task_count: taskCount,
    task_list_summary: taskListSummary,
  });
}

/**
 * Send file upload email
 */
export async function sendFileUploadEmail(
  toEmail: string,
  toName: string,
  uploaderName: string,
  fileName: string,
  teamName: string,
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = getFileUploadEmailHtml(toName, uploaderName, fileName, teamName, fileUrl);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `📁 New File in ${teamName}: ${fileName}`,
    message: htmlContent,
    uploader_name: uploaderName,
    file_name: fileName,
    team_name: teamName,
    file_url: fileUrl,
  });
}

/**
 * Send task deadline reminder email
 */
export async function sendTaskDeadlineReminderEmail(
  toEmail: string,
  toName: string,
  taskTitle: string,
  taskDeadline: string,
  hoursRemaining: number
): Promise<{ success: boolean; error?: string }> {
  const timeText = hoursRemaining < 1
    ? 'less than an hour'
    : hoursRemaining === 1
      ? '1 hour'
      : `${hoursRemaining} hours`;

  // Re-use task assignment template for now, or create a specific one if needed
  const htmlContent = getTaskAssignmentEmailHtml(
    toName,
    taskTitle,
    taskDeadline,
    "System Reminder",
    `Your task is due in ${timeText}.`
  );

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `Task Deadline Approaching: ${taskTitle}`,
    message: htmlContent,
    task_title: taskTitle,
    task_deadline: taskDeadline,
  });
}
