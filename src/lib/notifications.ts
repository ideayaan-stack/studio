/**
 * Browser notification utilities
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show browser notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-192x192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Show task assignment notification
 */
export async function notifyTaskAssignment(taskTitle: string, assignerName: string): Promise<void> {
  await showNotification({
    title: 'New Task Assigned',
    body: `${assignerName} assigned you: ${taskTitle}`,
    tag: 'task-assignment',
    requireInteraction: false,
  });
}

/**
 * Show task deadline reminder
 */
export async function notifyTaskDeadline(taskTitle: string, hoursRemaining: number): Promise<void> {
  const timeText = hoursRemaining < 1 
    ? 'less than an hour' 
    : hoursRemaining === 1 
    ? '1 hour' 
    : `${hoursRemaining} hours`;
  
  await showNotification({
    title: 'Task Deadline Approaching',
    body: `"${taskTitle}" is due in ${timeText}`,
    tag: 'task-deadline',
    requireInteraction: true,
  });
}

/**
 * Show new message notification
 */
export async function notifyNewMessage(senderName: string, messageText: string, teamName: string): Promise<void> {
  await showNotification({
    title: `New message in ${teamName}`,
    body: `${senderName}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
    tag: 'new-message',
    requireInteraction: false,
  });
}

