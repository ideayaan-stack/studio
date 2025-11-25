export const styles = {
    body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 40px 20px;",
    container: "max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);",
    header: "background-color: #18181b; color: white; padding: 30px; text-align: center;",
    headerLight: "background-color: #ffffff; padding: 30px 30px 0 30px; border-bottom: 0;",
    content: "padding: 40px 30px;",
    button: "display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 500; margin-top: 10px;",
    footer: "text-align: center; padding: 30px; background-color: #fafafa; color: #a1a1aa; font-size: 13px; border-top: 1px solid #f4f4f5;",
    badge: "background-color: #18181b; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px;",
    infoBox: "background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0;",
    label: "font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 4px; display: block; font-weight: 600;",
    value: "font-size: 16px; color: #18181b; font-weight: 500; margin-bottom: 15px; display: block;"
};

export function getWelcomeEmailHtml(toName: string, toEmail: string, role: string, teamName: string) {
    return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.container}">
    <div style="${styles.header}">
      <h1 style="margin:0; font-size:24px;">Ideayaan Studio</h1>
    </div>
    <div style="${styles.content}">
      <h2 style="margin-top: 0; color: #18181b; font-size: 20px;">Welcome to the team, ${toName}!</h2>
      <p style="color: #52525b;">Your account has been successfully created.</p>
      
      <div style="${styles.infoBox}">
        <span style="${styles.label}">Email</span>
        <span style="${styles.value}">${toEmail}</span>
        <span style="${styles.label}">Role</span>
        <span style="${styles.value}">${role}</span>
        <span style="${styles.label}">Team</span>
        <span style="${styles.value}">${teamName}</span>
      </div>
      
      <center>
        <a href="https://ideayaan-studio.vercel.app/login" style="${styles.button}">Login to Dashboard</a>
      </center>
    </div>
    <div style="${styles.footer}">
      <p>&copy; 2024 Ideayaan Studio</p>
    </div>
  </div>
</body>
</html>`;
}

export function getTaskAssignmentEmailHtml(toName: string, taskTitle: string, taskDeadline: string, assignerName: string, message: string) {
    return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.container}">
    <div style="${styles.headerLight}">
      <span style="${styles.badge}">NEW ASSIGNMENT</span>
    </div>
    <div style="${styles.content}">
      <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 10px 0;">${taskTitle}</h1>
      <div style="color: #71717a; font-size: 14px; margin-bottom: 25px;">
        Assigned by <strong>${assignerName}</strong> &bull; Due <strong>${taskDeadline}</strong>
      </div>
      
      <div style="background-color: #fafafa; border-left: 3px solid #18181b; padding: 20px; color: #52525b; font-style: italic; margin-bottom: 30px;">
        "${message}"
      </div>
      
      <center>
        <a href="https://ideayaan-studio.vercel.app/dashboard/tasks" style="${styles.button}">View Task Details</a>
      </center>
    </div>
    <div style="${styles.footer}">
      <p>Ideayaan Studio Notifications</p>
    </div>
  </div>
</body>
</html>`;
}

export function getDailyReminderEmailHtml(toName: string, taskCount: number, taskListSummary: string) {
    return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.container}">
    <div style="background: linear-gradient(135deg, #27272a 0%, #09090b 100%); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">Good Morning</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.8;">${toName}</p>
    </div>
    <div style="${styles.content}">
      <div style="text-align: center; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 30px;">
        <span style="font-size: 36px; font-weight: 800; color: #18181b; display: block;">${taskCount}</span>
        <span style="${styles.label}">Tasks Pending</span>
      </div>
      
      <div style="background-color: #fafafa; padding: 20px; border-radius: 12px;">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #71717a; text-transform: uppercase;">Priority Items</h3>
        <div style="color: #18181b;">
          ${taskListSummary}
        </div>
      </div>
      
      <center>
        <a href="https://ideayaan-studio.vercel.app/dashboard" style="${styles.button}">Open Dashboard</a>
      </center>
    </div>
    <div style="${styles.footer}">
      <p>Stay productive.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getFileUploadEmailHtml(toName: string, uploaderName: string, fileName: string, teamName: string, fileUrl: string) {
    return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.container}">
    <div style="${styles.content}; text-align: center;">
      <span style="font-size: 48px; margin-bottom: 20px; display: block;">📁</span>
      <h2 style="font-size: 20px; font-weight: 600; color: #18181b; margin: 0 0 10px 0;">New File Uploaded</h2>
      <p style="color: #71717a; margin: 0 0 30px 0;">A new file has been added to <strong>${teamName}</strong></p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 12px; text-align: left; margin-bottom: 30px;">
        <span style="font-weight: 600; color: #18181b; display: block;">${fileName}</span>
        <span style="font-size: 12px; color: #71717a;">Uploaded by ${uploaderName}</span>
      </div>
      
      <a href="${fileUrl}" style="${styles.button}">View File</a>
    </div>
    <div style="${styles.footer}">
      <p>Ideayaan Studio</p>
    </div>
  </div>
</body>
</html>`;
}
