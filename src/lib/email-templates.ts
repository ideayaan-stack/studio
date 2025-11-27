export const styles = {
  body: "font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0;",
  wrapper: "width: 100%; background-color: #f4f4f5; padding: 40px 0;",
  container: "max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);",
  header: "background-color: #18181b; color: white; padding: 40px 30px; text-align: center;",
  headerContent: "margin: 0;",
  logo: "font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin: 0;",
  content: "padding: 40px 30px;",
  heading: "font-size: 22px; font-weight: 600; color: #18181b; margin: 0 0 20px 0;",
  paragraph: "font-size: 16px; color: #52525b; margin: 0 0 20px 0;",
  buttonContainer: "text-align: center; margin: 30px 0;",
  button: "display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;",
  footer: "background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e4e4e7;",
  footerText: "font-size: 13px; color: #a1a1aa; margin: 0;",
  infoBox: "background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;",
  label: "font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; display: block; margin-bottom: 4px;",
  value: "font-size: 16px; color: #09090b; font-weight: 500; display: block; margin-bottom: 16px;",
  divider: "border-top: 1px solid #e4e4e7; margin: 30px 0;",
  highlight: "color: #f97316; font-weight: 600;",
};

const commonHeader = `
  <div style="${styles.header}">
    <h1 style="${styles.logo}">Ideayaan Studio</h1>
  </div>
`;

const commonFooter = `
  <div style="${styles.footer}">
    <p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Ideayaan Studio. All rights reserved.</p>
    <p style="${styles.footerText}; margin-top: 10px;">This is an automated message, please do not reply directly.</p>
  </div>
`;

export function getWelcomeEmailHtml(toName: string, toEmail: string, role: string, teamName: string) {
  return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${commonHeader}
      <div style="${styles.content}">
        <h2 style="${styles.heading}">Welcome to the team, ${toName}! 👋</h2>
        <p style="${styles.paragraph}">We are thrilled to have you on board. Your account has been successfully created and you are ready to start collaborating.</p>
        
        <div style="${styles.infoBox}">
          <span style="${styles.label}">Email</span>
          <span style="${styles.value}">${toEmail}</span>
          
          <span style="${styles.label}">Role</span>
          <span style="${styles.value}">${role}</span>
          
          <span style="${styles.label}">Team</span>
          <span style="${styles.value}" style="margin-bottom: 0;">${teamName}</span>
        </div>
        
        <div style="${styles.buttonContainer}">
          <a href="https://ideayaan.vercel.app/login" style="${styles.button}">Login to Dashboard</a>
        </div>
        
        <p style="${styles.paragraph}; font-size: 14px; color: #71717a;">If you have any trouble logging in, please contact your team lead.</p>
      </div>
      ${commonFooter}
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
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${commonHeader}
      <div style="${styles.content}">
        <h2 style="${styles.heading}">New Task Assigned 📋</h2>
        <p style="${styles.paragraph}">Hello ${toName}, you have been assigned a new task by <strong>${assignerName}</strong>.</p>
        
        <div style="${styles.infoBox}">
          <span style="${styles.label}">Task Title</span>
          <span style="${styles.value}; font-size: 18px; font-weight: 700;">${taskTitle}</span>
          
          <span style="${styles.label}">Due Date</span>
          <span style="${styles.value}; color: #ef4444;">${taskDeadline}</span>
          
          <div style="${styles.divider}"></div>
          
          <span style="${styles.label}">Instructions</span>
          <div style="font-size: 15px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        
        <div style="${styles.buttonContainer}">
          <a href="https://ideayaan.vercel.app/dashboard/tasks" style="${styles.button}">View Task Details</a>
        </div>
      </div>
      ${commonFooter}
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
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${commonHeader}
      <div style="${styles.content}">
        <h2 style="${styles.heading}">Daily Briefing 🌅</h2>
        <p style="${styles.paragraph}">Good morning, ${toName}. Here is your task summary for today.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 48px; font-weight: 800; color: #f97316; line-height: 1;">${taskCount}</div>
          <div style="font-size: 14px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Pending Tasks</div>
        </div>
        
        <div style="${styles.infoBox}">
          <span style="${styles.label}">Priority Items</span>
          <div style="margin-top: 10px;">
            ${taskListSummary}
          </div>
        </div>
        
        <div style="${styles.buttonContainer}">
          <a href="https://ideayaan.vercel.app/dashboard" style="${styles.button}">Open Dashboard</a>
        </div>
      </div>
      ${commonFooter}
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
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${commonHeader}
      <div style="${styles.content}">
        <h2 style="${styles.heading}">New File Uploaded 📁</h2>
        <p style="${styles.paragraph}">A new resource has been shared with the <strong>${teamName}</strong> team.</p>
        
        <div style="${styles.infoBox}">
          <span style="${styles.label}">File Name</span>
          <span style="${styles.value}; font-weight: 600;">${fileName}</span>
          
          <span style="${styles.label}">Uploaded By</span>
          <span style="${styles.value}">${uploaderName}</span>
        </div>
        
        <div style="${styles.buttonContainer}">
          <a href="${fileUrl}" style="${styles.button}">Download File</a>
        </div>
      </div>
      ${commonFooter}
    </div>
  </div>
</body>
</html>`;
}

export function getTaskCompletionEmailHtml(headName: string, volunteerName: string, taskTitle: string, completionReport: string, completedAt: string) {
  return `
<!DOCTYPE html>
<html>
<head><style>body { ${styles.body} }</style></head>
<body>
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${commonHeader}
      <div style="${styles.content}">
        <h2 style="${styles.heading}">Task Completed ✅</h2>
        <p style="${styles.paragraph}">Hello ${headName}, <strong>${volunteerName}</strong> has marked a task as completed.</p>
        
        <div style="${styles.infoBox}">
          <span style="${styles.label}">Task</span>
          <span style="${styles.value}; font-size: 18px; font-weight: 700;">${taskTitle}</span>
          
          <span style="${styles.label}">Completed At</span>
          <span style="${styles.value}">${completedAt}</span>
          
          <div style="${styles.divider}"></div>
          
          <span style="${styles.label}">Completion Report</span>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e4e4e7; font-size: 15px; color: #333; line-height: 1.6; white-space: pre-wrap;">${completionReport}</div>
        </div>
        
        <div style="${styles.buttonContainer}">
          <a href="https://ideayaan.vercel.app/dashboard/tasks" style="${styles.button}">Review Task</a>
        </div>
      </div>
      ${commonFooter}
    </div>
  </div>
</body>
</html>`;
}
