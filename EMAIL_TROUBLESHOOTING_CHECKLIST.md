# Quick Email Delivery Troubleshooting Checklist

## 1. Configuration Verification ✓

- [ ] Is `EMAIL_USER` OR `SMTP_HOST` set in `.env`?
- [ ] Is the corresponding password/API key set?
- [ ] Is `FRONTEND_URL` set to your actual frontend domain?
- [ ] Did you restart the backend server after changing `.env`?

**Check logs for:**
```
✅ Email transporter verified and ready
```

---

## 2. Gmail Setup (if using Gmail)

- [ ] Did you create an [App Password](https://myaccount.google.com/apppasswords)?
- [ ] Is it 16 characters with spaces (xxxx xxxx xxxx xxxx)?
- [ ] Is 2-Step Verification enabled on the account?
- [ ] Are you using App Password (NOT regular Gmail password)?
- [ ] Is `EMAIL_USER` set to your Gmail address?
- [ ] Is `EMAIL_APP_PASSWORD` set to the 16-char password?

---

## 3. Generic SMTP Setup

- [ ] Is `SMTP_HOST` correct? (Check your email provider docs)
- [ ] Is `SMTP_PORT` correct? (Usually 587 or 465)
- [ ] Is `SMTP_USER` your username/email?
- [ ] Is `SMTP_PASS` your password/API key?
- [ ] Did you try both 587 and 465 if one fails?

**Provider verification links:**
- Brevo: https://help.brevo.com/hc/en-us/articles/209460145
- SendGrid: https://sendgrid.com/docs/for-developers/sending-email/integrating-with-the-smtp-api/
- AWS SES: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-smtp.html

---

## 4. Network & Firewall

- [ ] Is your internet connection working?
- [ ] Is port 587 (or 465) open on your network?
- [ ] Does your ISP/firewall block SMTP ports?
- [ ] Can you ping the SMTP host? (e.g., `ping smtp.gmail.com`)

**Test SMTP connection manually (Linux/Mac):**
```bash
# Port 587 (STARTTLS)
openssl s_client -starttls smtp -connect smtp.gmail.com:587

# Port 465 (TLS)
openssl s_client -connect smtp.gmail.com:465
```

---

## 5. Email Logs Analysis

### Success ✅
```
📧 [STEP 1] Starting email send to: user@example.com
📧 [STEP 3] Transporter ready...
📧 [STEP 4] Sending email...
✅ [STEP 5] Email sent successfully!
✅ Message ID: <xxx@gmail.com>
✅ Status: 250 2.0.0 OK
```

### Failure - Invalid Credentials ❌
```
❌ [FAILED] Email sending failed
❌ Error Message: Invalid login credentials
❌ 🔐 HINT: Check your email credentials...
```
→ Fix: Verify `EMAIL_USER`, `EMAIL_APP_PASSWORD`, or SMTP credentials

### Failure - Invalid Host ❌
```
❌ [FAILED] Email sending failed
❌ Error Message: getaddrinfo ENOTFOUND smtp.example.com
❌ 🌐 HINT: Check your SMTP_HOST configuration...
```
→ Fix: Verify SMTP_HOST is spelled correctly

### Failure - Timeout ❌
```
❌ [FAILED] Email sending failed
❌ Error Message: connection timeout
❌ ⏱️  HINT: SMTP connection timed out...
```
→ Fix: Check network/firewall, or try different port

---

## 6. Email Received But in Spam

**Cause:** Missing email authentication

**Quick fixes:**
1. Gmail users: Check "Not Spam" button in Gmail
2. Domain owners: Add SPF record to DNS
   ```
   v=spf1 include:sendgrid.net ~all
   ```
3. Ask recipients to add you to contacts

**Long term:** See EMAIL_DELIVERY_FIX.md for SPF/DKIM/DMARC setup

---

## 7. Test Email Sending

### Via API
```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "teamId": 1
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invite": {
    "email": "test@example.com",
    "teamId": 1,
    "expiresAt": "2026-01-20T13:00:00Z"
  }
}
```

### Check Backend Logs
```
✅ Invitation email sent successfully
✅ Invitation created successfully
```

---

## 8. Common Solutions

| Problem | Solution |
|---------|----------|
| "Invalid login" | Use Gmail App Password, not regular password |
| "getaddrinfo ENOTFOUND" | Fix SMTP_HOST spelling |
| "connection timeout" | Try different port (587 vs 465) |
| "Email in spam folder" | Add SPF/DKIM records to DNS |
| "Transporter not initialized" | Set EMAIL_USER/SMTP_HOST in .env |
| "Email sent but not received" | Recipient spam filter - mark as not spam |

---

## 9. Enable Debug Logging (Advanced)

In your `src/config/db.js` or startup, set:
```javascript
process.env.DEBUG = '*:email*';
```

This will output verbose SMTP protocol logs.

---

## 10. Emergency Procedures

**If email service is down:**
1. ✅ Invitations are still created in database
2. ✅ Share invitation token with recipient manually
3. ✅ They can accept: `http://yourapp.com/accept-invite?token=TOKEN`
4. ✅ Fix email service when ready
5. ✅ No data loss - fully recoverable

---

## Still Having Issues?

1. **Check the full guide:** `EMAIL_DELIVERY_FIX.md`
2. **Review your .env file:** Are all variables set?
3. **Restart the backend:** Changes to .env require restart
4. **Check logs:** Copy exact error message
5. **Test SMTP manually:** Use `openssl` or online SMTP tester
6. **Contact email provider:** They can verify your account settings

---

## Support Email Providers

Ask your email provider for these details:
- [ ] SMTP hostname
- [ ] SMTP port (usually 587 or 465)
- [ ] Username (usually email address)
- [ ] Password or API key
- [ ] Authentication method (Basic, OAuth2, etc.)

Most providers have documentation at:
- `yourprovider.com/docs/smtp` or
- `help.yourprovider.com/smtp-settings`
