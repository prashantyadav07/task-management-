# Backend Implementation Setup & Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

This installs the new `socket.io@^4.7.2` dependency along with all existing packages.

### 2. Database Setup
The database schema will auto-initialize on server startup:
- New table: `team_chat_messages`
- Updated table: `tasks` (adds 3 new fields)

No manual migration needed! Just start the server.

### 3. Start Server
```bash
npm run dev    # Development mode with nodemon
# OR
npm start      # Production mode
```

You should see:
```
✅ Database connected
✅ Database schema initialized
✅ Admin user verified
✅ Server started on port 5000
```

### 4. Verify Socket.io is Working
Open browser console and test:
```javascript
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected:', socket.id));
socket.emit('join_team', 1);
```

---

## Environment Configuration

### Required .env Variables
```bash
DATABASE_URL=postgresql://username:password@host:database
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000

# Email Configuration (for invitations)
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-app-password

# Optional
FRONTEND_URL=http://localhost:5173
```

### Socket.io CORS Configuration
If deploying to new domains, update `src/server.js`:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://yourfrontend.com'
    ],
    credentials: true
  }
});
```

---

## Testing Features

### Test Setup
1. Create test admin and members via signup
2. Create test teams
3. Use provided test endpoints below

### 1. Real-Time Chat Testing

#### REST API Test
```bash
# Send message
curl -X POST http://localhost:5000/api/chat/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello team!"}'

# Get messages
curl -X GET http://localhost:5000/api/chat/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete message
curl -X DELETE http://localhost:5000/api/chat/message/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Socket.io Test Script
```javascript
// client-test.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Test 1: Join team
socket.emit('join_team', 1);

// Test 2: Listen for messages
socket.on('new_message', (data) => {
  console.log('New message:', data);
});

// Test 3: Send message via socket
socket.emit('send_message', {
  teamId: 1,
  userId: 5,
  message: 'Test message',
  messageId: Date.now(),
  userName: 'Test User'
});

// Test 4: Delete message
socket.emit('delete_message', {
  teamId: 1,
  messageId: 1,
  isHardDelete: false
});

// Test 5: Leave team
socket.emit('leave_team', 1);

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

**Expected Output:**
```
user_joined notification
new_message event with message details
message_deleted event
user_left notification
```

### 2. Task Deadline & Late Submission Testing

#### Create Task with Due Date
```bash
curl -X POST http://localhost:5000/api/tasks/member/create \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Report Due Tomorrow",
    "description": "Monthly report",
    "teamId": 1,
    "assignedToUserId": 5,
    "dueDate": "2026-01-14T17:00:00Z"
  }'
```

#### Complete Task Before Due Date
```bash
curl -X PUT http://localhost:5000/api/tasks/10/complete \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' # No reason needed, task is on-time
```
**Response:** ✅ Success, `isLateSubmission: false`

#### Complete Task After Due Date (No Reason)
```bash
# First, update task due date to past
# Then try to complete

curl -X PUT http://localhost:5000/api/tasks/10/complete \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Response:** ❌ 400 LATE_SUBMISSION_REASON_REQUIRED

#### Complete Task After Due Date (With Reason)
```bash
curl -X PUT http://localhost:5000/api/tasks/10/complete \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lateSubmissionReason": "Waiting for client feedback on design changes"
  }'
```
**Response:** ✅ Success, `isLateSubmission: true`, reason recorded

#### View Audit Trail
```bash
curl -X GET http://localhost:5000/api/tasks/10/details \
  -H "Authorization: Bearer TOKEN"
```
**Response includes:**
```json
{
  "auditTrail": {
    "created": "Task created on 1/10/2026 at 9:00:00 AM",
    "assigned": "Assigned on 1/10/2026 at 9:00:00 AM by Admin User",
    "completed": "Completed on 1/14/2026 at 6:15:00 PM by John Doe",
    "isLateSubmission": true,
    "lateReason": "Waiting for client feedback on design changes"
  }
}
```

### 3. Task Assignment Testing

#### Single Assignment (Admin)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Homepage",
    "teamId": 1,
    "assignedToUserId": 5
  }'
```

#### Multiple Assignment (Member)
```bash
curl -X POST http://localhost:5000/api/tasks/member/assign-multiple \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 10,
    "memberIds": [5, 6, 7]
  }'
```
**Result:** Task 10 is copied to users 5, 6, 7

#### Team-Wide Assignment
```bash
# Member creates task first
curl -X POST http://localhost:5000/api/tasks/member/create \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Training Session",
    "teamId": 1
  }'

# Then use TaskModel.assignToTeam() in code
```

### 4. Member Team Creation & Management Testing

#### Member Creates Team
```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product Team"}'
```
**Response:** ✅ Team created, user becomes owner

#### Member Invites Others
```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@example.com",
    "teamId": 2
  }'
```
**Result:**
- Invitation created in database
- Email sent with 24-hour expiration
- Email includes member's name as inviter

#### Verify Email Was Sent
Check server logs:
```
Invitation email sent successfully for colleague@example.com
```

### 5. Admin Operations Testing

#### Get Task Details (with audit trail)
```bash
curl -X GET http://localhost:5000/api/tasks/10/details \
  -H "Authorization: Bearer TOKEN"
```

#### Delete Task (Soft Delete)
```bash
curl -X DELETE http://localhost:5000/api/tasks/10 \
  -H "Authorization: Bearer ADMIN_TOKEN"
  # Default: soft delete (task marked deleted)
```

#### Delete Task (Hard Delete)
```bash
curl -X DELETE "http://localhost:5000/api/tasks/10?hard=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
  # Permanent deletion from database
```

#### Delete Member (with Cascade)
```bash
curl -X DELETE "http://localhost:5000/api/users/5?hard=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Cascade deletes:**
- All tasks assigned to/by member
- All team memberships
- All chat messages sent by member
- All teams owned by member
- All pending invitations

---

## Debugging

### Common Issues

#### Socket.io Not Connecting
```
Issue: "Failed to establish WebSocket connection"
Solution:
1. Check CORS origins in src/server.js match frontend URL
2. Ensure PORT 5000 is not blocked by firewall
3. Check browser console for CORS errors
```

#### Late Submission Detection Not Working
```
Issue: "Task marked as late even though before deadline"
Solution:
1. Check server timezone matches database timezone
2. Verify due_date is stored in correct format
3. Check database server time: SELECT NOW();
```

#### Emails Not Sending
```
Issue: "Invitation email not received"
Solution:
1. Verify EMAIL_USER and EMAIL_APP_PASSWORD in .env
2. Gmail: Use App Password, not regular password
3. Check Gmail "Less secure app access" setting
4. Look for email errors in server logs
5. Test with console.log before sending
```

#### Socket.io Events Not Triggering
```
Issue: "emit() works but on() doesn't receive"
Solution:
1. Ensure socket is connected before emitting
2. Check room name matches: team_${teamId}
3. Verify event listener on client matches event name exactly
4. Check server logs for Socket.io errors
```

### Useful Debug Commands

```bash
# Check if server is running
curl http://localhost:5000/health

# Check API status
curl http://localhost:5000/api

# View server logs (with npm run dev)
# Look for: Socket.io connection, message events, errors

# Test database connection
npm run db:test  # (if you add this script)

# Check Socket.io namespace
socket.io('http://localhost:5000').on('connect', () => {
  console.log('Socket.io working!');
});
```

---

## Performance Optimization

### Recommended Limits
```javascript
// In chat.controller.js
const limit = 100;      // Messages per request
const MAX_MESSAGE_LENGTH = 5000;  // Characters
const MAX_MESSAGES_PER_MINUTE = 10;  // Rate limit
```

### Database Indexes Created
- ✅ `idx_chat_messages_team_id` - Fast team lookups
- ✅ `idx_chat_messages_created_at` - Sort by time
- ✅ `idx_chat_messages_is_deleted` - Filter soft-deleted
- ✅ `idx_tasks_is_deleted` - Filter deleted tasks

### Socket.io Scalability
For production with multiple servers:
1. Add Redis adapter:
   ```bash
   npm install @socket.io/redis-adapter redis
   ```
2. Configure in `src/server.js`:
   ```javascript
   import { createAdapter } from '@socket.io/redis-adapter';
   io.adapter(createAdapter(pubClient, subClient));
   ```

---

## Monitoring & Logging

### Key Log Points
```
✅ Socket.io connection established
✅ User joined team room: team_1
✅ Chat message created successfully
✅ Message soft deleted
✅ Task assigned to multiple users
✅ Late submission detected
✅ Member deleted with cascade
```

### Error Monitoring
```
❌ Database connection failed
❌ Socket.io error
❌ Email sending failed (non-blocking)
❌ Authorization failed
❌ Validation error
```

---

## Rollback Instructions

If you need to rollback any changes:

### Remove Socket.io
1. `npm uninstall socket.io`
2. Revert `src/server.js` to original Express app.listen()
3. Remove chat routes from `src/app.js`
4. Keep `team_chat_messages` table (harmless)

### Remove Chat Features
1. Remove `src/models/chat.model.js`
2. Remove `src/controllers/chat.controller.js`
3. Remove `src/routes/chat.routes.js`
4. Remove chat route registration from `src/app.js`
5. Remove Socket.io code from `src/server.js`

### Remove Task Deadline Features
1. Task model new methods can stay (backward compatible)
2. Revert `updateStatusToCompleted()` to original in `src/controllers/task.controller.js`
3. Keep new database fields (they're optional)

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] CORS origins updated for production domains
- [ ] Database migrations run
- [ ] Socket.io domains configured
- [ ] Email service configured
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Monitoring/alerts set up

### Deployment Commands
```bash
# Install dependencies
npm install --production

# Run database migrations (auto on startup)
npm start

# Verify Socket.io
curl http://yourhost:5000/socket.io/?transport=websocket
```

### Monitoring Queries
```javascript
// Check message activity
SELECT COUNT(*) FROM team_chat_messages WHERE created_at > NOW() - INTERVAL '1 hour';

// Check task completion rate
SELECT COUNT(*) FILTER (WHERE status = 'COMPLETED') / COUNT(*) as completion_rate FROM tasks;

// Check late submissions
SELECT COUNT(*) FROM tasks WHERE late_submission_reason IS NOT NULL;
```

---

## Support

For issues or questions:
1. Check server logs: `npm run dev` shows all output
2. Check browser console for Socket.io errors
3. Test with Postman/Insomnia for REST endpoints
4. Verify database connection: Check DATABASE_URL in .env
5. Verify JWT token is valid and not expired

---

**Ready to test!** 🚀

All features are implemented and ready for testing. Start with the quick start guide above, then run through each feature's test section.

