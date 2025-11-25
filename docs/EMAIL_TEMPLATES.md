# EmailJS Templates & Configuration

I have upgraded your system to generate **Premium Modern HTML** emails directly from the code. This means you don't need to manage multiple complex templates in the EmailJS dashboard.

## 1. The "Universal" Template Strategy

Instead of creating 4 different templates in EmailJS, you only need **ONE** simple template that acts as a container. The code will inject the beautiful design into it.

### Step-by-Step Configuration:

1.  **Go to EmailJS Dashboard:**
    *   Log in to [emailjs.com](https://dashboard.emailjs.com/).
    *   Go to **"Email Templates"**.

2.  **Create/Edit Your Template:**
    *   Select your existing template (or create a new one).
    *   **Subject:** `{{subject}}`
    *   **Content (HTML Source):**
        *   Switch to "Source Code" view (click the `< >` button).
        *   Delete everything.
        *   Paste **ONLY** this line:
            ```html
            {{{message}}}
            ```
            *(Note: The triple curly braces `{{{ }}}` are important! They tell EmailJS to render the HTML correctly instead of showing tags.)*

3.  **Save:**
    *   Click **Save**.

## 2. That's It!

Your application code (`src/lib/email-templates.ts`) now handles all the design work. It will automatically generate the correct "Modern Studio" layout (Dark/Minimalist, Non-Blue) for:
*   Welcome Emails
*   Task Assignments
*   Daily Reminders
*   File Uploads

## 3. Design Preview

Here is what the code is generating for you:

**Style:** Modern Studio (Dark/Minimalist)
**Colors:** `#18181b` (Zinc-900), White, Subtle Grays.

### Example: New Task
The code generates a clean card with the task title, a dark badge, and the description in a highlighted box.

### Example: Daily Reminder
The code generates a "Good Morning" header with a dark gradient background and a summary of pending tasks.

---
**Troubleshooting:**
*   **If you see HTML tags (like `<html>...`) in your email:** You used double braces `{{message}}`. Change them to triple braces `{{{message}}}` in the EmailJS dashboard.
