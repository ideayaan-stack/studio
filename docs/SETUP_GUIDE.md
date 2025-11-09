# Complete Setup Guide

This guide will walk you through setting up all the new features: EmailJS for email notifications, ImgBB for free file storage, and browser notifications.

## Table of Contents

1. [EmailJS Setup](#emailjs-setup)
2. [ImgBB Setup](#imgbb-setup)
3. [Environment Variables](#environment-variables)
4. [Testing the Features](#testing-the-features)

---

## EmailJS Setup

### Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up"** (free account)
3. Complete registration with your email

### Step 2: Create Email Service

1. After logging in, go to **"Email Services"** in the dashboard
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended for personal use)
   - **Outlook** (for Microsoft accounts)
   - **Custom SMTP** (for other providers)

#### For Gmail:
1. Select **"Gmail"**
2. Click **"Connect Account"**
3. Sign in with your Gmail account
4. Grant permissions
5. Your service will be created with a **Service ID** (e.g., `service_abc123`)

#### For Outlook:
1. Select **"Outlook"**
2. Click **"Connect Account"**
3. Sign in with your Microsoft account
4. Grant permissions
5. Your service will be created with a **Service ID**

### Step 3: Create Email Template

1. Go to **"Email Templates"** in the dashboard
2. Click **"Create New Template"**
3. Use the template below:

#### Template for Task Assignment

**Template Name:** `task_assignment`

**Subject:**
```
New Task Assigned: {{task_title}}
```

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #3b82f6;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .task-card {
      background-color: white;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 New Task Assigned</h1>
  </div>
  <div class="content">
    <p>Hello {{to_name}},</p>
    
    <p><strong>{{assigner_name}}</strong> has assigned you a new task:</p>
    
    <div class="task-card">
      <h2 style="margin-top: 0; color: #1f2937;">{{task_title}}</h2>
      <p><strong>Deadline:</strong> {{task_deadline}}</p>
      <p>{{message}}</p>
    </div>
    
    <p>Please log in to your Ideayaan dashboard to view and complete this task.</p>
    
    <p>Best regards,<br>Ideayaan Team</p>
  </div>
  <div class="footer">
    <p>This is an automated notification from Ideayaan.</p>
    <p>If you have any questions, please contact your team administrator.</p>
  </div>
</body>
</html>
```

**Template Variables:**
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email
- `{{subject}}` - Email subject
- `{{message}}` - Custom message
- `{{task_title}}` - Task title
- `{{task_deadline}}` - Task deadline
- `{{assigner_name}}` - Person who assigned the task

4. Click **"Save"**
5. Note your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key

1. Go to **"Account"** → **"General"**
2. Find **"Public Key"** (e.g., `abcdefghijklmnop`)
3. Copy this key

### Step 5: Add to Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

**Note:** Replace the values with your actual IDs and keys.

---

## ImgBB Setup

### Step 1: Create ImgBB Account

1. Go to [https://imgbb.com/](https://imgbb.com/)
2. Click **"Sign Up"** (free account)
3. Complete registration

### Step 2: Get API Key

1. After logging in, go to **"Account Settings"** or **"API"**
2. Click on **"API Key"** or **"Generate API Key"**
3. Copy your API key (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

**Note:** ImgBB free tier allows:
- 32MB per file
- Unlimited storage
- Direct image URLs
- No bandwidth limits

### Step 3: Add to Environment Variables

Add this to your `.env.local` file:

```env
NEXT_PUBLIC_IMGBB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Note:** Replace with your actual API key.

---

## Environment Variables

Create or update your `.env.local`` file in the root directory:

```env
# Firebase Configuration (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-side)
FIREBASE_SERVICE_ACCOUNT_JSON=your_service_account_json

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abcdefghijklmnop

# ImgBB Configuration
NEXT_PUBLIC_IMGBB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Important Notes:

1. **Never commit `.env.local` to Git** - it's already in `.gitignore`
2. **Restart your dev server** after adding environment variables:
   ```bash
   npm run dev
   ```
3. **For production**, add these variables to your hosting platform (Vercel, Netlify, etc.)

---

## Testing the Features

### Test Browser Notifications

1. Open your app in the browser
2. When you create or assign a task, the browser will ask for notification permission
3. Click **"Allow"**
4. You should receive a browser notification when:
   - A task is assigned to you
   - A task deadline is approaching

### Test Email Notifications

1. Create a new task and assign it to a user
2. Check the assigned user's email inbox
3. You should receive an email with task details

**Troubleshooting:**
- Check browser console for errors
- Verify EmailJS credentials in `.env.local`
- Check EmailJS dashboard for sent emails log
- Ensure email service is connected properly

### Test File Upload (ImgBB)

1. Go to **Settings** → **Profile**
2. Try uploading a profile picture
3. The image should upload successfully
4. Check the browser console for any errors

**Troubleshooting:**
- Verify ImgBB API key in `.env.local`
- Check file size (max 32MB for ImgBB)
- Check file type (images only: JPG, PNG, GIF, WebP)

### Test Team Icon Upload

1. Go to **Settings** → **Team** (Core/Semi-core/Head only)
2. Upload a team icon
3. The icon should appear in:
   - Chat header
   - Team list
   - Team details

### Test Dark Mode

1. Go to **Settings** → **Appearance**
2. Toggle between Light, Dark, and System themes
3. The theme should change immediately
4. Refresh the page - theme should persist

### Test Avatar Rings

1. Check user avatars throughout the app
2. You should see:
   - **Core**: Solid red ring (full circle)
   - **Semi-core**: Dashed blue ring (full circle)
   - **Head**: Dotted green ring (full circle)
   - **Volunteer**: Gradient purple ring (full circle)

---

## Feature Summary

### ✅ Implemented Features

1. **Dark Mode**
   - Full theme switching (Light/Dark/System)
   - Theme persistence
   - No flash on page load

2. **Mobile-Responsive Settings**
   - Sheet navigation on mobile
   - Touch-friendly inputs (44px minimum)
   - Responsive layouts

3. **Notifications**
   - Browser notifications (task assignments, deadlines)
   - Email notifications via EmailJS
   - Notification preferences UI

4. **Chat Enhancements**
   - Team icon display
   - Team icon upload (Core/Semi-core/Head)
   - Improved mobile layout

5. **File Storage**
   - ImgBB integration for images
   - Base64 fallback for small files
   - Profile picture upload
   - Team icon upload

6. **Avatar Rings**
   - Full circular rings around avatars
   - Different styles per role:
     - Core: Solid red
     - Semi-core: Dashed blue
     - Head: Dotted green
     - Volunteer: Gradient purple

---

## Troubleshooting

### EmailJS Not Working

1. **Check credentials:**
   - Verify Service ID, Template ID, and Public Key in `.env.local`
   - Ensure no extra spaces or quotes

2. **Check template:**
   - Verify template variables match the code
   - Test template in EmailJS dashboard

3. **Check email service:**
   - Ensure service is connected
   - Check email service status in dashboard

4. **Check browser console:**
   - Look for error messages
   - Check network tab for failed requests

### ImgBB Not Working

1. **Check API key:**
   - Verify API key in `.env.local`
   - Ensure key is correct and active

2. **Check file:**
   - Max size: 32MB
   - Supported formats: JPG, PNG, GIF, WebP
   - Check browser console for errors

3. **Check quota:**
   - Free tier has no storage limits
   - Check ImgBB dashboard for account status

### Browser Notifications Not Working

1. **Check permission:**
   - Browser may have blocked notifications
   - Go to browser settings → Site settings → Notifications
   - Allow notifications for your site

2. **Check browser:**
   - Some browsers don't support notifications
   - Try Chrome, Firefox, or Edge

3. **Check code:**
   - Verify notification service is imported
   - Check browser console for errors

---

## Support

If you encounter any issues:

1. Check browser console for errors
2. Verify all environment variables are set correctly
3. Ensure all services (EmailJS, ImgBB) are properly configured
4. Check the documentation in `docs/` folder
5. Review the implementation in the codebase

---

## Next Steps

1. ✅ Set up EmailJS account and add credentials
2. ✅ Set up ImgBB account and add API key
3. ✅ Add environment variables to `.env.local`
4. ✅ Restart dev server
5. ✅ Test all features
6. ✅ Deploy to production (add env vars to hosting platform)

---

**Last Updated:** January 2025

