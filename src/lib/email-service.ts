import {
  getWelcomeEmailHtml,
  getTaskAssignmentEmailHtml,
  getDailyReminderEmailHtml,
  getFileUploadEmailHtml,
  getTaskCompletionEmailHtml
} from './email-templates';
import { sendEmailAction } from '@/actions/email-actions';

/**
 * Email Service (Brevo/SMTP Integration)
 * 
 * Replaced EmailJS with Brevo for higher free limits (300/day).
 * Uses Server Actions to send emails securely via SMTP.
 */

// No initialization needed for server-side SMTP
export function initializeEmailJS(): void {
  // Deprecated, keeping for interface compatibility
  console.log('Email service initialized (Brevo SMTP)');
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
 * Send email via Server Action (Brevo)
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

    // Call the server action
    const result = await sendEmailAction({
      to_email: options.to_email,
      to_name: options.to_name,
      subject: options.subject,
      message: options.message, // This is expected to be the HTML content
    });

    return result;
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

/**
 * Send task completion email to Head
 */
export async function sendTaskCompletionEmail(
  toEmail: string,
  toName: string,
  volunteerName: string,
  taskTitle: string,
  completionReport: string,
  completedAt: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = getTaskCompletionEmailHtml(toName, volunteerName, taskTitle, completionReport, completedAt);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: `Task Completed: ${taskTitle}`,
    message: htmlContent,
    task_title: taskTitle,
  });
}
