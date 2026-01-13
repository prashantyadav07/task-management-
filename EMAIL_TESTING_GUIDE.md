# Email Testing - API Examples & Commands

## Prerequisites

1. Backend server running: `npm run dev`
2. Valid JWT token (from login)
3. At least one team created
4. Test email address ready

---

## API Testing Examples

### 1. Send Test Invitation (cURL)

**Basic command:**
```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test-recipient@example.com",
    "teamId": 1
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invite": {
    "email": "test-recipient@example.com",
    "teamId": 1,
    "expiresAt": "2026-01-20T13:00:00Z"
  }
}
```

**Expected Backend Logs:**
```
📧 [STEP 1] Starting email send to: test-recipient@example.com
📧 [STEP 3] Transporter ready, preparing mail options...
📧 [STEP 4] Sending email...
✅ [STEP 5] Email sent successfully!
```

---

### 2. Send Test Invitation (JavaScript/Fetch)

```javascript
const sendTestInvitation = async (email, teamId, jwtToken) => {
  try {
    const response = await fetch('http://localhost:5000/api/invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        email: email,
        teamId: teamId
      })
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Invitation sent successfully!');
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Usage:
sendTestInvitation('test@example.com', 1, 'your_jwt_token_here');
```

---

### 3. Send Test Invitation (Postman)

**Setup in Postman:**

1. **Create new request**
   - Method: POST
   - URL: `http://localhost:5000/api/invites`

2. **Headers tab:**
   - Key: `Content-Type` | Value: `application/json`
   - Key: `Authorization` | Value: `Bearer YOUR_JWT_TOKEN`

3. **Body tab (raw JSON):**
   ```json
   {
     "email": "test@example.com",
     "teamId": 1
   }
   ```

4. **Send** and check response

---

## Testing Scenarios

### Scenario 1: Happy Path (Everything Works)

**Setup:**
- Valid JWT token
- Valid email address
- Valid team ID
- Email service configured

**Steps:**
1. Send invitation API call
2. Check API response (should be success)
3. Check backend logs (should show STEP 5 success)
4. Check recipient email (should arrive in 5-10 seconds)
5. Click acceptance link in email

**Expected Result:**
```
✅ API returns 201 success
✅ Backend logs show email sent
✅ Email arrives in inbox
✅ Recipient can accept invitation
```

---

### Scenario 2: Email Service Not Configured

**Setup:**
- Valid JWT token
- Valid email address  
- Valid team ID
- NO email configuration (missing .env variables)

**Steps:**
1. Send invitation API call
2. Check backend logs

**Expected Result:**
```
❌ Backend logs show:
❌ [NO TRANSPORTER] Email NOT sent
❌ Please configure either:
   - Gmail: Set EMAIL_USER and EMAIL_APP_PASSWORD
   - SMTP: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
```

**Solution:** Configure .env file and restart server

---

### Scenario 3: Invalid Credentials

**Setup:**
- Valid JWT token
- Valid email and team ID
- Email configured but with WRONG credentials

**Steps:**
1. Send invitation API call
2. Check backend logs

**Expected Result:**
```
❌ Backend logs show:
❌ [FAILED] Email sending failed
❌ Error Message: Invalid login credentials
❌ 🔐 HINT: Check your email credentials...
```

**Solution:** Verify credentials in .env file

---

### Scenario 4: Invalid SMTP Host

**Setup:**
- SMTP configuration with WRONG hostname

**Steps:**
1. Send invitation API call
2. Check backend logs

**Expected Result:**
```
❌ Backend logs show:
❌ [FAILED] Email sending failed
❌ Error Message: getaddrinfo ENOTFOUND smtp.wrong.host.com
❌ 🌐 HINT: Check your SMTP_HOST configuration...
```

**Solution:** Verify SMTP_HOST spelling

---

### Scenario 5: Connection Timeout

**Setup:**
- Network connection down, or
- Firewall blocking SMTP port, or
- SMTP server down

**Steps:**
1. Send invitation API call
2. Check backend logs

**Expected Result:**
```
❌ Backend logs show:
❌ [FAILED] Email sending failed after 30000ms
❌ Error Message: connection timeout
❌ ⏱️  HINT: SMTP connection timed out...
```

**Solution:** Check network, firewall, or try different port

---

## Testing All Email Features

### 1. Test Invitation Email

```bash
# Send test invitation
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "teamId": 1
  }'

# Check backend logs
# Should see: ✅ Email sent successfully!

# Check email inbox
# Should arrive within 10 seconds
```

---

### 2. Test Password Reset Email

```bash
# If you have a password reset endpoint
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Check backend logs
# Should see: ✅ Email sent successfully!

# Check email inbox
# Should contain reset link
```

---

## Monitoring Email Logs

### Real-time Log Monitoring

**Terminal 1 - Run backend with logging:**
```bash
npm run dev 2>&1 | grep -E "(📧|✅|❌)"
```

**Terminal 2 - Send test invitation:**
```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "test@example.com", "teamId": 1}'
```

**Terminal 1 output should show:**
```
📧 [STEP 1] Starting email send to: test@example.com
📧 [STEP 3] Transporter ready...
📧 [STEP 4] Sending email...
✅ [STEP 5] Email sent successfully!
```

---

## Email Content Verification

### What Should Be in the Invitation Email

**Subject Line:**
```
You've been invited to join TeamName
```

**Email Body:**
- Greeting with team name
- Professional formatting
- Clickable "Accept Invitation" button
- Fallback text link
- Footer with app name

**Accept Link Format:**
```
https://yourdomain.com/accept-invite?token=abc123def456...
```

**Example Email:**
```
Dear User,

You have been invited to join the team "Project Alpha".

[Accept Invitation] <- Clickable button

Or copy this link: https://app.example.com/accept-invite?token=...

---
This is an automated email from TaskFlow.
```

---

## Performance Metrics

### Acceptable Email Delivery Times

| Metric | Target | Warning |
|--------|--------|---------|
| Backend processing | < 2 seconds | > 5 seconds |
| Network transmission | < 3 seconds | > 10 seconds |
| Total time | < 5 seconds | > 15 seconds |
| Email arrival | < 10 seconds | > 30 seconds |

**Check backend logs:**
```
✅ Duration: 1234ms  ← Should be < 5000ms
```

---

## Batch Testing (Multiple Emails)

### Test Sending Multiple Invitations

```bash
#!/bin/bash

# Array of test emails
EMAILS=("test1@example.com" "test2@example.com" "test3@example.com")
TOKEN="YOUR_JWT_TOKEN"
TEAM_ID=1

for email in "${EMAILS[@]}"; do
  echo "Sending invitation to: $email"
  
  curl -X POST http://localhost:5000/api/invites \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"email\": \"$email\",
      \"teamId\": $TEAM_ID
    }"
  
  echo ""
  sleep 2  # Wait 2 seconds between requests
done
```

---

## Error Handling Test

### Test Invalid Email Format

```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "invalid-email",
    "teamId": 1
  }'

# Expected: 400 Bad Request with validation error
```

---

### Test Missing Parameters

```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com"
  }'

# Expected: 400 Bad Request - Team ID required
```

---

### Test Invalid Team ID

```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "teamId": 99999
  }'

# Expected: 404 Not Found or validation error
```

---

## Debugging with Node.js

### Enable Detailed SMTP Debugging

Add to your `backend/src/services/email.service.js`:

```javascript
// After creating transporter
transporter.set('logger', true);
transporter.set('debug', true);

// This will log all SMTP protocol commands
```

Then restart server and check logs - you'll see:
```
SMTP --> 220 smtp.gmail.com ESMTP
SMTP <-- EHLO
SMTP --> 250 PIPELINING
...
```

---

## Database Verification

### Check If Invitation Was Created

```sql
-- Check invitations table
SELECT 
  id,
  email,
  team_id,
  token,
  created_at,
  expires_at
FROM invites
ORDER BY created_at DESC
LIMIT 5;
```

This confirms invitation was saved to database even if email failed.

---

## Common Test Email Addresses

**For testing locally:**
```
test@example.com
recipient@test.com
demo@demo.com
user+test@gmail.com
```

**Gmail allows these variations:**
```
your-email@gmail.com
your.email@gmail.com
youremail@gmail.com
your-email+test@gmail.com  ← All go to same inbox
```

---

## Next Steps After Testing

1. ✅ Email configuration verified
2. ✅ Test invitation sent successfully
3. ✅ Email arrived in recipient inbox
4. ✅ Recipient can accept invitation
5. ✅ No errors in backend logs

**You're ready for production!**

See [EMAIL_DELIVERY_FIX.md](EMAIL_DELIVERY_FIX.md) for production recommendations.
