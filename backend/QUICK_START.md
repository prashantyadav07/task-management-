# Quick Start Guide - New Features

## 🚀 Quick Setup

### 1. Update Database (Automatic)
The new tables are created automatically when the server starts (via `init-db.js`).

**Manual Check:**
```bash
psql $DATABASE_URL -c "\dt"  # List all tables
```

### 2. Start Server
```bash
npm start  # or npm run dev for development
```

### 3. Test New Features

---

## 🔐 Feature 1: Team Deletion

### Create and Delete a Team
```bash
# Create team
TOKEN="your-jwt-token"
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Team"}'

# Response contains teamId = 1

# Delete team (creator only)
curl -X DELETE http://localhost:5000/api/teams/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

---

## 📧 Feature 2: Bulk Invitations

### Send Multiple Invitations
```bash
curl -X POST http://localhost:5000/api/invites/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "emails": [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com"
    ]
  }'
```

### Check Batch Status
```bash
BATCH_ID="batch_uuid_from_response"
curl -X GET http://localhost:5000/api/invites/bulk/$BATCH_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Accept Invitation (From Email Link)
```bash
TOKEN_FROM_EMAIL="token_from_invitation_link"
curl -X POST http://localhost:5000/api/invites/bulk/accept/$TOKEN_FROM_EMAIL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'
```

---

## 👥 Feature 3: Member Teams

### Member Creates Team
```bash
# Any user (including members) can create a team
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Team"}'

# Member is automatically the owner and first member
```

### Member Invites Others
```bash
# Member can invite to their team
curl -X POST http://localhost:5000/api/invites/bulk \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "emails": ["someone@example.com"]
  }'
```

---

## 💬 Feature 4: Real-Time Chat

### Get Previous Messages
```bash
curl -X GET "http://localhost:5000/api/chat/1?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Send Message via REST
```bash
curl -X POST http://localhost:5000/api/chat/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello team!"}'
```

### Join Team Chat (Real-time via Socket.IO)
```javascript
// Frontend/Browser
const socket = io('http://localhost:5000');

// Join team
socket.emit('join_team', { teamId: 1, userId: 123 });

// Send message
socket.emit('send_message', {
  teamId: 1,
  userId: 123,
  userName: 'John Doe',
  message: 'Hello everyone!',
  messageId: 'msg_' + Date.now()
});

// Listen for messages (old to new order)
socket.on('new_message', (msg) => {
  console.log(`${msg.userName}: ${msg.message}`);
});

// Edit message
socket.emit('edit_message', {
  teamId: 1,
  messageId: 'msg_12345',
  newMessage: 'Updated message'
});

// Listen for edits
socket.on('message_edited', (data) => {
  console.log(`Message ${data.messageId} edited`);
});

// Leave team
socket.emit('leave_team', { teamId: 1, userId: 123 });
```

---

## 🔒 Feature 5: Chat Isolation

### Verify Isolation
```bash
# Team 1 - User is member
curl -X GET http://localhost:5000/api/chat/1 \
  -H "Authorization: Bearer $TOKEN"
# Returns: 200 with messages

# Team 2 - User is NOT member
curl -X GET http://localhost:5000/api/chat/2 \
  -H "Authorization: Bearer $TOKEN"
# Returns: 403 Forbidden
```

---

## 📊 API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (authorization error) |
| 404 | Not Found |
| 500 | Server Error |

---

## 🐛 Debugging

### Check Server Logs
```bash
# Server will log all operations
# Look for:
# - "Team deleted successfully"
# - "Bulk invitation batch created"
# - "Chat message created"
# - "User joined team room"
```

### Verify Database
```bash
# Check new tables exist
psql $DATABASE_URL -c "SELECT * FROM bulk_invites;"
psql $DATABASE_URL -c "SELECT * FROM team_ownership;"
psql $DATABASE_URL -c "SELECT * FROM team_chat_messages ORDER BY created_at ASC;"
```

### Test Chat Messages Ordering
```bash
# Messages should be ordered oldest to newest (ASC)
psql $DATABASE_URL -c "SELECT id, message, created_at FROM team_chat_messages WHERE team_id = 1 ORDER BY created_at ASC;"
```

---

## ⚠️ Common Issues

### Issue: "User is not a member of this team"
**Solution:** Add user to team first
```bash
# Must join via invitation or be added by team owner
```

### Issue: "Only admins can delete tasks"
**Solution:** Use admin token, and only the admin who created task can delete it

### Issue: "Cannot invite more than 100 users"
**Solution:** Split large invites into multiple batches of ≤100 each

### Issue: "Invitation has already been accepted"
**Solution:** Each token can only be used once

---

## ✅ Validation Checklist

- [ ] Database tables created (init-db.js ran)
- [ ] Server started without errors
- [ ] Can create team
- [ ] Can delete team (creator)
- [ ] Can send bulk invitations
- [ ] Can accept bulk invitation
- [ ] Chat messages display oldest to newest
- [ ] Can only see messages from joined teams
- [ ] Socket.IO real-time chat works

---

## 📚 Full Documentation

For detailed information, see:
- **FEATURES_IMPLEMENTATION.md** - Complete feature documentation
- **NEW_API_REFERENCE.md** - Detailed API reference with all endpoints
- **IMPLEMENTATION_COMPLETE.md** - Full implementation summary

---

## 🎯 Next Steps

1. **Test all endpoints** using curl or Postman
2. **Verify authorization** on boundary conditions
3. **Test Socket.IO** with browser console
4. **Check database** for data consistency
5. **Review logs** for any issues

---

## 📞 Support

If issues arise:
1. Check server logs first
2. Verify database connection
3. Check authentication token validity
4. Verify user has appropriate permissions
5. Review documentation files

---

**Ready to use!** All features are production-ready. 🚀
