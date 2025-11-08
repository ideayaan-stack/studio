# Firebase Admin SDK Troubleshooting Guide

This guide helps you diagnose and fix issues with Firebase Admin SDK configuration.

## Common Error Messages

### Error 1: "Firebase Admin SDK service account credentials not found"

**What it means:**
The environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` is not set or not being read.

**Solutions:**

1. **Check `.env.local` exists:**
   ```bash
   # In project root, verify file exists
   ls .env.local  # Linux/Mac
   dir .env.local  # Windows
   ```

2. **Verify environment variable format:**
   ```env
   # Correct format:
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   
   # Wrong formats:
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # Missing quotes
   FIREBASE_SERVICE_ACCOUNT_JSON="{"type":"service_account",...}"  # Wrong quote type
   ```

3. **Check file location:**
   - `.env.local` must be in **project root** (same level as `package.json`)
   - Not in `src/` or any subdirectory

4. **Restart dev server:**
   - Environment variables are only loaded when server starts
   - Stop server (Ctrl+C) and restart: `npm run dev`

### Error 2: "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON"

**What it means:**
The JSON string is malformed or has syntax errors.

**Solutions:**

1. **Validate JSON format:**
   - Copy the JSON from `.env.local`
   - Paste into [JSONLint](https://jsonlint.com/) to validate
   - Fix any syntax errors

2. **Check for common issues:**
   - **Multi-line JSON**: Must be on single line
   - **Unescaped quotes**: Single quotes inside JSON need escaping
   - **Missing commas**: Check all fields have commas between them
   - **Trailing commas**: Remove comma after last field

3. **Re-download service account:**
   - Go to Firebase Console → Service Accounts
   - Generate new private key
   - Copy entire JSON again
   - Replace in `.env.local`

4. **Check quote handling:**
   ```env
   # If JSON contains single quotes, escape them:
   FIREBASE_SERVICE_ACCOUNT_JSON='{"key":"value with \'single quotes\'"}'
   
   # Or use double quotes and escape them:
   FIREBASE_SERVICE_ACCOUNT_JSON="{\"key\":\"value\"}"
   ```

### Error 3: "Service account JSON is missing required fields"

**What it means:**
The JSON doesn't have all required fields (`type`, `project_id`, `private_key`).

**Solutions:**

1. **Verify JSON completeness:**
   - Service account JSON should have these fields:
     - `type`: "service_account"
     - `project_id`: "ideayaan-cd964"
     - `private_key_id`: "..."
     - `private_key`: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     - `client_email`: "..."
     - `client_id`: "..."
     - `auth_uri`: "..."
     - `token_uri`: "..."
     - And more...

2. **Re-download from Firebase:**
   - Don't manually edit the JSON
   - Download fresh copy from Firebase Console
   - Use that exact content

3. **Check for truncation:**
   - Ensure entire JSON was copied
   - Check file size (should be ~2-3 KB)
   - Verify no content was cut off

## Step-by-Step Debugging

### Step 1: Verify Environment Variable is Loaded

Add temporary debug code in `src/firebase/firebase-admin.ts`:

```typescript
const getServiceAccount = () => {
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    // Debug: Check if env var exists
    console.log('Env var exists:', !!envVar);
    console.log('Env var length:', envVar?.length || 0);
    console.log('Env var first 50 chars:', envVar?.substring(0, 50));
    
    // ... rest of code
}
```

**What to check:**
- If `envVar` is `undefined`, the env var isn't being loaded
- If length is 0, the env var is empty
- If first chars look wrong, there's a format issue

### Step 2: Test JSON Parsing

```typescript
try {
    const parsed = JSON.parse(envVar);
    console.log('JSON parsed successfully');
    console.log('Has type:', !!parsed.type);
    console.log('Has project_id:', !!parsed.project_id);
    console.log('Has private_key:', !!parsed.private_key);
} catch (error) {
    console.error('JSON parse error:', error.message);
}
```

### Step 3: Verify File Format

Check `.env.local` file:

```bash
# View file (first 200 chars)
head -c 200 .env.local  # Linux/Mac
Get-Content .env.local | Select-Object -First 1  # Windows PowerShell
```

**Should see:**
```
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...
```

## Common Mistakes

### Mistake 1: Wrong File Name
- ❌ `.env` (wrong)
- ❌ `env.local` (wrong)
- ✅ `.env.local` (correct)

### Mistake 2: Wrong Location
- ❌ `src/.env.local` (wrong)
- ❌ `docs/.env.local` (wrong)
- ✅ Root directory `.env.local` (correct)

### Mistake 3: Multi-line JSON
```env
# ❌ Wrong:
FIREBASE_SERVICE_ACCOUNT_JSON='{
  "type": "service_account",
  ...
}'

# ✅ Correct:
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Mistake 4: Not Restarting Server
- Environment variables are loaded at server start
- Must restart after changing `.env.local`

### Mistake 5: Wrong Quote Type
```env
# ❌ Wrong (double quotes):
FIREBASE_SERVICE_ACCOUNT_JSON="..."

# ✅ Correct (single quotes):
FIREBASE_SERVICE_ACCOUNT_JSON='...'
```

## Quick Fix Checklist

- [ ] `.env.local` exists in project root
- [ ] File name is exactly `.env.local` (with dot)
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` is set
- [ ] JSON is on single line
- [ ] JSON is valid (test with JSONLint)
- [ ] Using single quotes around JSON
- [ ] Dev server was restarted after adding env var
- [ ] Service account JSON is complete (not truncated)
- [ ] Project ID in JSON matches `ideayaan-cd964`

## Still Not Working?

1. **Try alternative format:**
   ```env
   # Try without quotes (if JSON doesn't have quotes inside):
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

2. **Check Next.js env var loading:**
   - Next.js only loads `.env.local` in development
   - For production, set env vars in hosting platform

3. **Verify file encoding:**
   - Should be UTF-8
   - No BOM (Byte Order Mark)

4. **Check for hidden characters:**
   - Copy JSON to text editor
   - Remove any invisible characters
   - Re-paste

5. **Test with minimal JSON:**
   ```env
   # Temporarily test with minimal valid JSON:
   FIREBASE_SERVICE_ACCOUNT_JSON='{"test":"value"}'
   ```
   If this works, the issue is with the service account JSON format.

## Getting Help

If still having issues, provide:
1. Error message (exact text)
2. Server logs (console output)
3. `.env.local` format (first 100 chars, hide sensitive data)
4. Node.js version: `node --version`
5. Next.js version: `npm list next`

---

**Most issues are resolved by:**
1. Ensuring `.env.local` is in project root
2. Using correct JSON format (single line, valid JSON)
3. Restarting dev server after changes

