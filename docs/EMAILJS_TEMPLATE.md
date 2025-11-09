# EmailJS Email Template

This document contains the complete EmailJS template configuration for task assignment notifications.

## Template Configuration

### Template Name
`task_assignment`

### Template ID
Copy this from your EmailJS dashboard after creating the template.

---

## Email Template

### Subject Line
```
New Task Assigned: {{task_title}}
```

### HTML Content

Copy and paste this into your EmailJS template editor:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      margin: 20px auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .task-card {
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .task-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 10px 0;
    }
    .task-detail {
      margin: 10px 0;
      color: #4b5563;
    }
    .task-detail strong {
      color: #1f2937;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📋 New Task Assigned</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        <p>Hello <strong>{{to_name}}</strong>,</p>
      </div>
      
      <p>You have been assigned a new task by <strong>{{assigner_name}}</strong>.</p>
      
      <div class="task-card">
        <h2 class="task-title">{{task_title}}</h2>
        <div class="task-detail">
          <strong>Deadline:</strong> {{task_deadline}}
        </div>
        <div class="task-detail">
          <strong>Assigned by:</strong> {{assigner_name}}
        </div>
        <div class="divider"></div>
        <div class="task-detail">
          {{message}}
        </div>
      </div>
      
      <div class="button-container">
        <a href="#" class="button">View Task in Dashboard</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Please log in to your Ideayaan dashboard to view full task details and start working on it.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Ideayaan - Team Management System</strong></p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>If you have any questions, please contact your team administrator.</p>
    </div>
  </div>
</body>
</html>
```

---

## Template Variables

Make sure these variables are set in your EmailJS template:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_name}}` | Recipient's display name | "John Doe" |
| `{{to_email}}` | Recipient's email address | "john@example.com" |
| `{{subject}}` | Email subject line | "New Task Assigned: Design Logo" |
| `{{message}}` | Custom message | "Please complete this task by the deadline." |
| `{{task_title}}` | Task title | "Design Company Logo" |
| `{{task_deadline}}` | Task deadline | "Jan 15, 2025 18:00" |
| `{{assigner_name}}` | Person who assigned the task | "Jane Smith" |

---

## Setup Instructions

1. **Log in to EmailJS Dashboard**
   - Go to [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)

2. **Create New Template**
   - Click on **"Email Templates"**
   - Click **"Create New Template"**

3. **Configure Template**
   - **Template Name:** `task_assignment`
   - **Subject:** `New Task Assigned: {{task_title}}`
   - **Content:** Copy the HTML above

4. **Save Template**
   - Click **"Save"**
   - Note your **Template ID** (e.g., `template_xyz789`)

5. **Add to Environment Variables**
   ```env
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
   ```

---

## Testing the Template

1. **Test in EmailJS Dashboard**
   - Use the "Test" button in the template editor
   - Fill in sample values for all variables
   - Send a test email to yourself

2. **Test in Application**
   - Create a new task in your app
   - Assign it to a user
   - Check the user's email inbox

---

## Customization

You can customize the template by:

1. **Changing Colors**
   - Update the `background-color` values in the CSS
   - Change the gradient in `.header`

2. **Adding Logo**
   - Add an `<img>` tag in the header
   - Use a hosted image URL

3. **Changing Fonts**
   - Update the `font-family` in the CSS
   - Use Google Fonts if needed

4. **Adding More Information**
   - Add more variables to the template
   - Update the code to send additional data

---

## Troubleshooting

### Email Not Sending

1. Check EmailJS dashboard for error logs
2. Verify all template variables are set
3. Ensure email service is connected
4. Check spam folder

### Template Not Rendering

1. Verify HTML is valid
2. Check variable names match exactly
3. Test template in EmailJS dashboard first

### Variables Not Replacing

1. Ensure variable names match exactly (case-sensitive)
2. Check that variables are being sent from the code
3. Verify template variables are defined in EmailJS

---

**Last Updated:** January 2025

