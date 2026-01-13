# 📋 Email Fix - Quick Action Checklist

## Before You Start

- [ ] Backend repository location: `c:\Users\dell\Desktop\task management using pern stack\backend`
- [ ] You have a test email address to receive invitations
- [ ] You can access the backend logs in terminal
- [ ] You have a valid JWT token for testing API

---

## Step 1: Choose Email Provider (Pick ONE)

### Option A: Gmail ⭐ (Recommended for Testing)
- [ ] Gmail account with 2-Step Verification enabled
- [ ] Ready to create App Password

### Option B: Brevo/SendGrid (For Production)
- [ ] Free account created
- [ ] SMTP credentials ready

### Option C: Other Provider
- [ ] SMTP details obtained from provider

---

## Step 2: Configure Email (3 minutes)

### For Gmail Users:
```
1. [ ] Go to https://myaccount.google.com/apppasswords
2. [ ] Select "Mail" and "Windows Computer"
3. [ ] Copy the 16-character password (includes spaces)
4. [ ] Open backend/.env file
5. [ ] Add:
       EMAIL_USER=your-gmail@gmail.com
       EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
6. [ ] Make sure FRONTEND_URL=http://localhost:5173 is set
7. [ ] Save file
```

### For SMTP Users:
```
1. [ ] Get SMTP details from provider documentation
2. [ ] Open backend/.env file
3. [ ] Add:
       SMTP_HOST=smtp.provider.com
       SMTP_PORT=587
       SMTP_USER=your-username
       SMTP_PASS=your-password
4. [ ] Make sure FRONTEND_URL is set correctly
5. [ ] Save file
```

---

## Step 3: Restart Backend (1 minute)

```bash
# In terminal, in backend directory:
[ ] Stop current server (Ctrl+C if running)
[ ] npm run dev
[ ] Wait for startup messages
```

**Look for this message:**
```
✅ Email transporter verified and ready
```

If you see this ✅ - Continue to Step 4

If you see ❌ - Go to Troubleshooting

---

## Step 4: Test Email Sending (2 minutes)

### Option A: Via cURL (Copy-Paste)

```bash
[ ] Copy this command:

curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "email": "your-test-email@gmail.com",
    "teamId": 1
  }'

[ ] Replace YOUR_JWT_TOKEN_HERE with your actual JWT token
[ ] Replace your-test-email@gmail.com with test email
[ ] Paste into terminal
[ ] Press Enter
```

### Option B: Via API/Postman

```
[ ] Method: POST
[ ] URL: http://localhost:5000/api/invites
[ ] Header 1: Content-Type = application/json
[ ] Header 2: Authorization = Bearer YOUR_JWT_TOKEN
[ ] Body: {
    "email": "test@example.com",
    "teamId": 1
  }
[ ] Click Send
```

### Check Response:

```
[ ] Response status is 201 or 200
[ ] Response contains: "success": true
[ ] Response shows: "Invitation sent successfully"
```

---

## Step 5: Verify Email Arrived (2 minutes)

```
[ ] Wait 10 seconds
[ ] Check test email inbox (not spam)
[ ] Email should be from TaskFlow
[ ] Subject: "You've been invited to join [TeamName]"
[ ] Contains "Accept Invitation" button
[ ] Contains acceptance link
```

**Email not arriving?**
→ Go to "Troubleshooting" section below

---

## Step 6: Check Backend Logs (1 minute)

Look in backend terminal for these messages:

```
[ ] ✅ Using Gmail SMTP configuration (or Generic SMTP)
[ ] ✅ Email transporter verified and ready
[ ] 📧 [STEP 1] Starting email send to: test@example.com
[ ] 📧 [STEP 3] Transporter ready...
[ ] 📧 [STEP 4] Sending email...
[ ] ✅ [STEP 5] Email sent successfully!
[ ] ✅ Message ID: <xxx@domain.com>
[ ] ✅ Status: 250 2.0.0 OK
```

**All items checked?** ✅ **CONFIGURATION SUCCESSFUL!**

---

## Troubleshooting Quick Fixes

### ❌ "Email transporter verification failed"

**Cause:** Email credentials are wrong

**Fix:**
1. [ ] Double-check EMAIL_USER spelling
2. [ ] Verify EMAIL_APP_PASSWORD is 16 chars with spaces
3. [ ] Make sure you're using App Password (not Gmail password)
4. [ ] Save .env file
5. [ ] Restart server: `npm run dev`

---

### ❌ "Invalid login credentials"

**Cause:** Wrong username or password

**Fix:**
1. [ ] Verify credentials in .env file
2. [ ] For Gmail: Go to myaccount.google.com/apppasswords
3. [ ] For SMTP: Check email provider documentation
4. [ ] Copy credentials again (no typos)
5. [ ] Restart server

---

### ❌ "getaddrinfo ENOTFOUND smtp.something.com"

**Cause:** SMTP host is spelled wrong or unreachable

**Fix:**
1. [ ] Check SMTP_HOST spelling carefully
2. [ ] Common: smtp.gmail.com, smtp-relay.brevo.com, smtp.sendgrid.net
3. [ ] Verify against provider documentation
4. [ ] Restart server

---

### ❌ "connection timeout"

**Cause:** Network issue or port blocked

**Fix:**
1. [ ] Check internet connection
2. [ ] Try different SMTP_PORT:
   - [ ] Try 587 (STARTTLS)
   - [ ] Try 465 (TLS)
3. [ ] Check if firewall blocks SMTP
4. [ ] Restart server

---

### ❌ Email sent but arrived in spam folder

**Cause:** Email authentication headers missing

**Fix:**
1. [ ] Email should still work for testing
2. [ ] Ask recipient to mark as "Not Spam"
3. [ ] For production: Set up SPF/DKIM records
4. [ ] See EMAIL_DELIVERY_FIX.md for details

---

### ❌ API call returns error

**Check:**
1. [ ] JWT token is valid (not expired)
2. [ ] Team ID exists in database
3. [ ] Email address is valid format
4. [ ] Check backend logs for specific error

---

## What Each File Does

| File | What It Does |
|------|-------------|
| `src/services/email.service.js` | Sends emails via Gmail or SMTP |
| `src/controllers/invite.controller.js` | Handles invitation API calls |
| `src/config/mail.js` | DEPRECATED - now just a warning |
| `.env` | Your configuration (email credentials) |

---

## Success Indicators

✅ You'll know it's working when:

- [ ] Backend logs show: `✅ Email transporter verified and ready`
- [ ] API returns 201 success on invitation
- [ ] Backend logs show: `✅ Email sent successfully!`
- [ ] Email arrives in inbox within 1 minute
- [ ] Email looks professional with formatting
- [ ] Recipient can click acceptance link

**All checked?** 🎉 **YOU'RE DONE!**

---

## Common Gmail App Password Issues

- [ ] Using regular Gmail password instead of App Password → **Use App Password**
- [ ] App Password has 15 characters instead of 16 → **Generate a new one**
- [ ] 2-Step Verification not enabled → **Enable it first**
- [ ] Copying password with typo → **Copy carefully, test paste**
- [ ] .env file not saved → **Save explicitly (Ctrl+S)**

---

## Common SMTP Issues

- [ ] Using wrong SMTP host → **Check provider docs**
- [ ] Using port 25 (blocked) → **Try 587 or 465**
- [ ] Username is just email → **Use full email: user@domain.com**
- [ ] API key contains special chars → **Make sure to copy exactly**

---

## Files to Reference

| Issue | See This File |
|-------|---------------|
| How do I set up email? | EMAIL_DELIVERY_FIX.md |
| How do I test it? | EMAIL_TESTING_GUIDE.md |
| What went wrong? | EMAIL_TROUBLESHOOTING_CHECKLIST.md |
| Did it work? | VERIFICATION_GUIDE.md |
| What changed? | IMPLEMENTATION_SUMMARY.md |
| Configuration example | backend/.env.example |

---

## Quick Reference: Environment Variables

### Gmail Configuration
```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

### Brevo Configuration
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-api-key
FRONTEND_URL=http://localhost:5173
```

### SendGrid Configuration
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx...
FRONTEND_URL=http://localhost:5173
```

---

## Before Deploying to Production

- [ ] Test email delivery works locally
- [ ] Choose production email provider
- [ ] Set up SPF/DKIM records (if using custom domain)
- [ ] Test in staging environment
- [ ] Monitor first few days for delivery issues
- [ ] Set up error alerts/logging

---

## Final Checklist

Before saying "Issue Resolved":

1. **Configuration:**
   - [ ] Email provider chosen
   - [ ] Credentials in .env
   - [ ] Backend restarted

2. **Verification:**
   - [ ] Backend logs show transporter ready
   - [ ] Test API call successful
   - [ ] Email arrived in inbox
   - [ ] No errors in logs

3. **Functionality:**
   - [ ] Email has correct subject
   - [ ] Email has team name
   - [ ] Acceptance link works
   - [ ] Invitation recorded in database

**All items complete?** 

# ✅ ISSUE RESOLVED! 

You can now:
- Send invitations successfully
- Recipients get emails reliably
- No more delivery issues
- Ready for production

---

## Need More Help?

1. **Read the full guide:** EMAIL_DELIVERY_FIX.md
2. **Check test examples:** EMAIL_TESTING_GUIDE.md
3. **Troubleshoot issue:** EMAIL_TROUBLESHOOTING_CHECKLIST.md
4. **Verify setup:** VERIFICATION_GUIDE.md

**Still stuck?** Check backend logs - they tell you exactly what's wrong!

---

**Created:** January 13, 2026
**Status:** ✅ Ready to Use
**Support:** See documentation files
