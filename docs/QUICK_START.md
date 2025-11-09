# Quick Start Guide

Get up and running with the new features in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

Create or update `.env.local`:

```env
# EmailJS (Optional - for email notifications)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# ImgBB (Optional - for image uploads)
NEXT_PUBLIC_IMGBB_API_KEY=your_api_key
```

### 3. Restart Server
```bash
npm run dev
```

---

## 📧 EmailJS Setup (5 minutes)

1. **Sign up:** [emailjs.com](https://www.emailjs.com/)
2. **Create service:** Connect Gmail/Outlook
3. **Create template:** Copy from `docs/EMAILJS_TEMPLATE.md`
4. **Get credentials:** Service ID, Template ID, Public Key
5. **Add to `.env.local`**

**Free tier:** 200 emails/month

---

## 🖼️ ImgBB Setup (2 minutes)

1. **Sign up:** [imgbb.com](https://imgbb.com/)
2. **Get API key:** Account Settings → API
3. **Add to `.env.local`**

**Free tier:** 32MB per file, unlimited storage

---

## ✅ Test Everything

1. **Dark Mode:** Settings → Appearance → Toggle theme
2. **Profile Picture:** Settings → Profile → Upload image
3. **Team Icon:** Settings → Team → Upload icon (Core/Semi-core/Head)
4. **Notifications:** Create a task → Assign to user → Check email/browser
5. **Avatar Rings:** Check user avatars (different rings per role)

---

## 🆘 Troubleshooting

### Notifications not working?
- Check browser permission (Settings → Notifications)
- Verify EmailJS credentials in `.env.local`
- Check browser console for errors

### File uploads not working?
- Verify ImgBB API key in `.env.local`
- Check file size (max 32MB for ImgBB)
- Check file type (images only)

### Dark mode not working?
- Clear browser cache
- Check browser console for errors
- Verify `next-themes` is installed

---

## 📚 Full Documentation

- **Complete Setup:** `docs/SETUP_GUIDE.md`
- **EmailJS Template:** `docs/EMAILJS_TEMPLATE.md`
- **Implementation Details:** `docs/IMPLEMENTATION_SUMMARY.md`

---

**That's it!** You're ready to go! 🎉

