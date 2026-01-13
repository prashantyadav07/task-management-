# Email Delivery Issue - Fix & Setup Guide

## Issues Found & Fixed

### 1. **Dual Email Configuration Conflict**
**Problem:** Your codebase had TWO separate email configurations:
- `mail.js` using SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- `email.service.js` using EMAIL_USER, EMAIL_APP_PASSWORD (Gmail only)

This caused confusion and prevented proper email delivery.

**Solution:** Unified the email service to support BOTH Gmail and generic SMTP, with proper fallback logic.

---

### 2. **Function Name Mismatch**
**Problem:** 
- `invite.controller.js` was importing `sendInviteEmail`
- `email.service.js` exported `sendInvitationEmail`

**Solution:** Fixed the import and added backward compatibility aliases.

---

### 3. **Missing Error Diagnostics**
**Problem:** Email failures weren't providing helpful error messages to diagnose why delivery failed.

**Solution:** Added detailed diagnostic hints for common errors:
- Invalid credentials
- Invalid SMTP host
- Connection timeouts
- Authentication failures

---

## Configuration Setup

### Option 1: Using Gmail (Recommended for Testing)

1. **Create a Gmail App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already done
   - Under "App passwords", select Mail and Windows Computer
   - Copy the 16-character password

2. **Set Environment Variables** in your `.env` file:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
EMAIL_SENDER_NAME=TaskFlow
```

3. **Verify Configuration:**
   - Restart your backend server
   - You should see: `✅ Email transporter verified and ready` in logs

---

### Option 2: Using Generic SMTP (For Production/Custom Email Services)

1. **Get SMTP Details from Your Email Provider:**
   - Brevo (Sendinblue), SendGrid, AWS SES, Office 365, etc.
   - Note: host, port, username, password

2. **Set Environment Variables** in your `.env` file:
```env
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
FRONTEND_URL=https://yourdomain.com
EMAIL_SENDER_NAME=TaskFlow
```

3. **Port Selection:**
   - Port 587: STARTTLS (encrypted upgrade) - Most common
   - Port 465: SSL/TLS (encrypted from start) - Some providers
   - Port 25: Unencrypted - Not recommended

---

## Testing Email Delivery

### 1. **Check Backend Logs**
Start your server and look for initialization messages:
```
✅ Using Gmail SMTP configuration
  EMAIL_USER: your-gmail@gmail.com
✅ Email transporter initialized
✅ Email transporter verified and ready
```

### 2. **Send Test Invitation**
Use your API:
```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d {
    "email": "recipient@example.com",
    "teamId": 1
  }
```

### 3. **Monitor Logs for Delivery Status**
You should see:
```
📧 [STEP 1] Starting email send to: recipient@example.com
📧 [STEP 3] Transporter ready, preparing mail options...
📧 [STEP 4] Sending email...
✅ [STEP 5] Email sent successfully!
✅ Message ID: <xxx@mail.gmail.com>
✅ Recipient: recipient@example.com
✅ Status: 250 2.0.0 OK
```

---

## Troubleshooting Checklist

### ✓ Email Not Arriving (Common Causes)

| Issue | Solution |
|-------|----------|
| **Gmail blocking login** | Use App Password, NOT regular password |
| **Invalid SMTP host** | Verify SMTP_HOST spelling (smtp.gmail.com, smtp.brevo.com, etc.) |
| **Port wrong** | Try 587 (STARTTLS) if 465 (TLS) fails, or vice versa |
| **Credentials wrong** | Double-check SMTP_USER and SMTP_PASS |
| **Email in spam/junk** | See "Email Authentication" section below |
| **Firewall blocking SMTP** | Check if port 25, 465, or 587 is blocked |
| **Network timeout** | Check internet connection and SMTP server availability |

### ✓ Authentication Errors

If you see: `❌ Invalid login` or `authentication failure`

**For Gmail:**
1. Ensure you're using a Gmail App Password (not regular password)
2. App Password format: xxxx xxxx xxxx xxxx (16 chars with spaces)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**For Other Providers:**
1. Verify credentials are correct
2. Check if account is locked or has security restrictions
3. Some providers require whitelist of sender addresses

---

## Email Authentication (Prevent Spam/Junk)

### Why Emails End Up in Spam

Gmail, Outlook, and other providers use these checks:

1. **SPF (Sender Policy Framework)**
   - Verifies sender IP is authorized
   - Add SPF record to your domain DNS

2. **DKIM (DomainKeys Identified Mail)**
   - Digitally signs emails
   - Add DKIM record to your domain DNS

3. **DMARC (Domain-based Message Authentication)**
   - Sets policy for failed SPF/DKIM
   - Add DMARC record to your domain DNS

### Setting Up Email Authentication

**For Gmail (sending from @gmail.com):**
- Gmail automatically handles SPF, DKIM, DMARC
- Emails should go to inbox, not spam

**For Custom Domain:**
Contact your email provider (Brevo, SendGrid, etc.) for:
- SPF record to add
- DKIM keys to add
- DMARC policy to set

Example SPF record:
```
v=spf1 include:sendgrid.net ~all
```

---

## File Changes Made

### 1. `backend/src/config/mail.js`
- Deprecated (no longer used)
- Now just a warning pointing to email.service.js

### 2. `backend/src/services/email.service.js`
- ✅ Added support for Gmail SMTP
- ✅ Added support for generic SMTP
- ✅ Added detailed error diagnostics
- ✅ Added email headers for better deliverability
- ✅ Improved logging at each step
- ✅ Added backward compatibility aliases

### 3. `backend/src/controllers/invite.controller.js`
- ✅ Fixed import to use correct function name
- ✅ Fixed to pass token instead of URL to email service
- ✅ Added team name lookup for email context

---

## Production Recommendations

### Email Provider Comparison

| Provider | Cost | Best For | Setup Time |
|----------|------|----------|-----------|
| Gmail | FREE | Testing, small apps | 5 min |
| Brevo (Sendinblue) | FREE 300/day | Small startups | 10 min |
| SendGrid | FREE 100/day | Development | 10 min |
| AWS SES | $0.10/1000 | Scaling production | 20 min |
| MailerLite | $0 basic | Email campaigns | 15 min |

### For Production:
1. Use a dedicated email service (not Gmail account)
2. Set up proper SPF/DKIM/DMARC records
3. Monitor bounce rates and spam complaints
4. Use proper email templates with unsubscribe links
5. Implement rate limiting on email sending

---

## Next Steps

1. **Choose Configuration:**
   - Gmail for testing
   - Brevo/SendGrid for small production
   - AWS SES for scale

2. **Update .env File:**
   - Set appropriate email environment variables
   - Verify FRONTEND_URL is correct

3. **Test Delivery:**
   - Send a test invitation
   - Verify email arrives in inbox (not spam)
   - Check backend logs for any errors

4. **Monitor Logs:**
   - Watch for delivery failures
   - Use diagnostic hints to troubleshoot

5. **Set Up Authentication (Optional):**
   - Add SPF/DKIM/DMARC for production domains
   - Improves inbox placement

---

## Support for Common Providers

### Gmail
```
SERVICE: gmail
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
Use App Password, not regular password
```

### Brevo (Sendinblue)
```
SMTP_HOST: smtp-relay.brevo.com
SMTP_PORT: 587
SMTP_USER: your-email@domain.com
SMTP_PASS: Your Brevo SMTP password
```

### SendGrid
```
SMTP_HOST: smtp.sendgrid.net
SMTP_PORT: 587
SMTP_USER: apikey
SMTP_PASS: Your SendGrid API key
```

### AWS SES
```
SMTP_HOST: email-smtp.region.amazonaws.com
SMTP_PORT: 587
SMTP_USER: AWS username
SMTP_PASS: AWS password
```

### Office 365
```
SMTP_HOST: smtp.office365.com
SMTP_PORT: 587
SMTP_USER: your@domain.com
SMTP_PASS: Your password
```

---

## Emergency Fallback

If email service fails:
1. Invitation record is still created in database
2. User can accept invitation via direct link (admin provides manually)
3. Email remains in "pending" state
4. Retry when email service is back online

This ensures no data loss even if email fails!
