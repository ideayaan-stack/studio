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

export interface EmailOptions {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  task_title?: string;
  task_deadline?: string;
  assigner_name?: string;
}

/**
 * Send email via EmailJS
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      error: 'EmailJS not configured. Please add EmailJS credentials to .env.local',
    };
  }

  try {
    // Dynamically import emailjs-com
    const emailjs = await import('@emailjs/browser');
    
    const templateParams = {
      to_email: options.to_email,
      to_name: options.to_name,
      subject: options.subject,
      message: options.message,
      task_title: options.task_title || '',
      task_deadline: options.task_deadline || '',
      assigner_name: options.assigner_name || '',
    };

    await emailjs.send(serviceId, templateId, templateParams, {
      publicKey,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
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
  assignerName: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `New Task Assigned: ${taskTitle}`,
    message: `${assignerName} has assigned you a new task: "${taskTitle}". Deadline: ${taskDeadline}`,
    task_title: taskTitle,
    task_deadline: taskDeadline,
    assigner_name: assignerName,
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
  
  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `Task Deadline Approaching: ${taskTitle}`,
    message: `Your task "${taskTitle}" is due in ${timeText}. Deadline: ${taskDeadline}`,
    task_title: taskTitle,
    task_deadline: taskDeadline,
  });
}

