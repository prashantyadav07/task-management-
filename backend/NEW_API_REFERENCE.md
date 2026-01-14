# New Backend API Endpoints - Quick Reference

## Team Management

### Delete Team
```
DELETE /api/teams/:id
Authorization: Required
Authorization Check: Team creator only
```
**Response (200):**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

---

## Task Management

### Delete Task
```
DELETE /api/tasks/:id?hard=true
Authorization: Required (ADMIN role)
Authorization Check: Task creator only
```
**Query Parameters:**
- `hard=true` - Hard delete (permanent)
- `hard=false` - Soft delete (mark deleted)

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": { ... }
}
```

---

## Invitation Management

### Send Bulk Invitations
```
POST /api/invites/bulk
Authorization: Required
Authorization Check: ADMIN or team owner/member
Content-Type: application/json
```

**Request Body:**
```json
{
  "teamId": 1,
  "emails": ["user1@example.com", "user2@example.com"]
}
```

**Constraints:**
- Max 100 emails per request
- Emails are deduplicated
- Already-members are filtered out

**Response (201):**
```json
{
  "success": true,
  "message": "Bulk invitations sent successfully",
  "batch": {
    "batchId": "batch_uuid",
    "teamId": 1,
    "totalInvites": 2
  },
  "invitedEmails": ["user1@example.com", "user2@example.com"],
  "alreadyMembers": [],
  "emailResults": [
    { "email": "user1@example.com", "sent": true },
    { "email": "user2@example.com", "sent": true }
  ]
}
```

---

### Accept Bulk Invitation
```
POST /api/invites/bulk/accept/:token
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "teamId": 1,
  "teamName": "Team Name",
  "userId": 123
}
```

---

### Get Bulk Batch Details
```
GET /api/invites/bulk/:batchId
Authorization: Required
```

**Response (200):**
```json
{
  "success": true,
  "batch": {
    "id": 1,
    "batch_id": "batch_uuid",
    "team_id": 1,
    "created_by_user_id": 10,
    "total_invites": 3,
    "accepted_count": 2,
    "pending_count": 1,
    "status": "ACTIVE",
    "created_at": "2024-01-14T10:00:00Z"
  },
  "items": [
    {
      "id": 1,
      "batch_id": "batch_uuid",
      "email": "user1@example.com",
      "status": "ACCEPTED",
      "expires_at": "2024-01-15T10:00:00Z",
      "accepted_at": "2024-01-14T15:30:00Z"
    }
  ]
}
```

---

## Chat API (Updated)

### Get Team Messages
```
GET /api/chat/:teamId?limit=100&offset=0
Authorization: Required
Authorization Check: User must be team member
```

**Response (200):**
```json
{
  "success": true,
  "message": "Team messages retrieved successfully",
  "data": {
    "teamId": 1,
    "messages": [
      {
        "id": 1,
        "team_id": 1,
        "user_id": 123,
        "message": "Hello team!",
        "created_at": "2024-01-14T10:30:00Z",
        "is_deleted": false,
        "user_name": "John Doe",
        "user_email": "john@example.com"
      }
    ],
    "count": 1
  }
}
```

---

### Send Team Message
```
POST /api/chat/:teamId
Authorization: Required
Authorization Check: User must be team member
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Hello team!"
}
```

**Constraints:**
- Min 1 character
- Max 5000 characters

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 1,
    "team_id": 1,
    "user_id": 123,
    "message": "Hello team!",
    "created_at": "2024-01-14T10:30:00Z",
    "is_deleted": false
  }
}
```

---

## Socket.IO Events

### Join Team Chat
**Event:** `join_team`
```javascript
socket.emit('join_team', {
  teamId: 1,
  userId: 123
});
```

**Response:** `joined_team`
```javascript
{
  teamId: 1,
  room: 'team_1',
  message: 'Successfully joined team chat'
}
```

---

### Send Message (Real-time)
**Event:** `send_message`
```javascript
socket.emit('send_message', {
  teamId: 1,
  userId: 123,
  userName: 'John Doe',
  message: 'Hello!',
  messageId: 'msg_uuid'
});
```

**Broadcast:** `new_message` (to all in room)
```javascript
{
  id: 'msg_uuid',
  teamId: 1,
  userId: 123,
  userName: 'John Doe',
  message: 'Hello!',
  created_at: '2024-01-14T10:30:00Z',
  is_deleted: false
}
```

---

### Delete Message (Real-time)
**Event:** `delete_message`
```javascript
socket.emit('delete_message', {
  teamId: 1,
  messageId: 'msg_uuid',
  isHardDelete: false
});
```

**Broadcast:** `message_deleted` (to all in room)
```javascript
{
  messageId: 'msg_uuid',
  teamId: 1,
  isHardDelete: false,
  timestamp: '2024-01-14T10:31:00Z'
}
```

---

### Edit Message (Real-time)
**Event:** `edit_message`
```javascript
socket.emit('edit_message', {
  teamId: 1,
  messageId: 'msg_uuid',
  newMessage: 'Updated message'
});
```

**Broadcast:** `message_edited` (to all in room)
```javascript
{
  messageId: 'msg_uuid',
  teamId: 1,
  newMessage: 'Updated message',
  timestamp: '2024-01-14T10:32:00Z'
}
```

---

### Leave Team Chat
**Event:** `leave_team`
```javascript
socket.emit('leave_team', {
  teamId: 1,
  userId: 123
});
```

**Broadcast:** `user_left` (to all in room)
```javascript
{
  userId: 123,
  teamId: 1,
  message: 'A team member left the chat',
  timestamp: '2024-01-14T10:33:00Z'
}
```

---

## Error Responses

### Common Error Codes and Status

| Status | Error Code | Message |
|--------|-----------|---------|
| 400 | VALIDATION_ERROR | Validation failed |
| 403 | AUTHORIZATION_ERROR | You are not authorized |
| 404 | NOT_FOUND | Resource not found |
| 500 | *_ERROR | Server error |

**Example Error Response:**
```json
{
  "success": false,
  "errorCode": "AUTHORIZATION_ERROR",
  "message": "You are not a member of this team"
}
```

---

## Examples

### Create Team and Send Bulk Invite
```bash
# 1. Create team
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Development Team"}'

# Response contains teamId, e.g., 1

# 2. Send bulk invites
curl -X POST http://localhost:5000/api/invites/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "emails": ["dev1@example.com", "dev2@example.com", "dev3@example.com"]
  }'
```

### Real-time Chat Flow
```javascript
// User joins team
socket.emit('join_team', { teamId: 1, userId: 123 });

// Send message (appears for all in team)
socket.emit('send_message', {
  teamId: 1,
  userId: 123,
  userName: 'Alice',
  message: 'Hey team!',
  messageId: 'msg_1'
});

// Listen for messages from other users
socket.on('new_message', (msg) => {
  console.log(`${msg.userName}: ${msg.message}`);
});

// Leave team when done
socket.emit('leave_team', { teamId: 1, userId: 123 });
```

---

## Notes

- All endpoints require authentication unless otherwise specified
- Timestamps are in ISO 8601 format (UTC)
- Email sending is non-blocking (API succeeds even if email fails)
- Socket.IO messages are isolated per team (no cross-team leakage)
- Hard delete is permanent; soft delete marks record as deleted
