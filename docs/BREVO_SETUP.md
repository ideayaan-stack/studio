# 📧 Switching to Brevo (Free 300 emails/day)

I have updated your app to use **Brevo (SMTP)** instead of EmailJS. This gives you **300 free emails per day** (approx 9,000/month), which covers your requirement of 200 users.

## 🚀 Step 1: Get Your Credentials

1.  **Create Account:** Go to [Brevo.com](https://www.brevo.com/) and sign up for a free account.
2.  **Get SMTP Key:**
    *   Click on your profile name (top right) -> **SMTP & API**.
    *   Click on the **SMTP** tab.
    *   Click **"Generate a new SMTP key"**.
    *   **Name:** `Ideayaan App`
    *   **Copy the Key** immediately (you won't see it again).

## 🔑 Step 2: Update Environment Variables

Open your `.env.local` file and add these lines:

```env
# Brevo SMTP Settings
BREVO_SMTP_USER=your_login_email@example.com
BREVO_SMTP_KEY=your_generated_smtp_key_here

# Sender Info (Optional, defaults to these if not set)
NEXT_PUBLIC_SENDER_EMAIL=noreply@ideayaan.com
NEXT_PUBLIC_SENDER_NAME=Ideayaan Studio
```

*   **BREVO_SMTP_USER:** The email address you used to login to Brevo.
*   **BREVO_SMTP_KEY:** The long key you just copied (starts with `xsmtps-...` usually).

## 🧹 Step 3: Cleanup (Optional)

You can remove the old EmailJS variables from your `.env.local` file if you want, as they are no longer used:
*   `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
*   `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
*   `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

## ✅ Done!

Your app is now using Brevo.
*   **No more templates to manage:** The code generates the beautiful HTML automatically.
*   **Higher Limits:** 300 emails/day for free.
*   **Better Delivery:** SMTP is generally more reliable.
