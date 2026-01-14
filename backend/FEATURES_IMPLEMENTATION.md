# Backend Features Implementation Guide

## Overview
This document outlines all newly implemented backend features for the Task Management PERN Stack application.

---

## Feature 1: Admin Delete Permissions

### Overview
Admins and members can delete teams they created, and admins can delete tasks they assigned.

### Database Changes
- **New Tables:**
  - `team_ownership`: Tracks team creation for authorization (team_id, creator_user_id, creator_role)
  - `task_ownership`: Tracks task creation for authorization (task_id, creator_user_id, creator_role)

### Endpoints

#### Delete a Team
- **Route:** `DELETE /api/teams/:id`
- **Auth:** Requires authentication
- **Authorization:** Only the team creator (admin or member) can delete their team
- **Request:** 
  ```bash
  curl -X DELETE http://localhost:5000/api/teams/1 \
    -H "Authorization: Bearer <token>"
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Team deleted successfully"
  }
  ```
- **Cascade Behavior:** Deleting a team cascades to delete:
  - All team members
  - All tasks in the team
  - All chat messages in the team
  - All invitations to the team

#### Delete a Task
- **Route:** `DELETE /api/tasks/:id?hard=true`
- **Auth:** Requires authentication with ADMIN role
- **Authorization:** Only the admin who created the task can delete it
- **Query Parameters:**
  - `hard=true`: Hard delete (permanent removal)
  - `hard=false` (default): Soft delete (mark as deleted)
- **Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/tasks/1?hard=true \
    -H "Authorization: Bearer <admin-token>"
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Task deleted successfully",
    "data": { ... }
  }
  ```

### Authorization Logic
- **Team Deletion:** Uses `team_ownership` table to check if user is the creator
- **Task Deletion:** Only admins can delete; checks `task_ownership` to verify admin created the task
- Both support fallback checking using team `owner_id` if ownership record doesn't exist

### Models Used
- `OwnershipModel`: Handles all ownership tracking and authorization checks
- `TeamModel`: Updated `create()` to track ownership
- `TaskModel`: Updated `create()` to track ownership

---

## Feature 2: Multiple User Invitations (Bulk Invite)

### Overview
Admin and team owners can invite multiple users to a team in a single operation using bulk invitations.

### Database Changes
- **New Tables:**
  - `bulk_invites`: Batch record (id, batch_id, team_id, created_by_user_id, total_invites, accepted_count, pending_count, status)
  - `bulk_invite_items`: Individual invite items (id, batch_id, email, token, status, expires_at, accepted_at)

### Endpoints

#### Send Bulk Invitations
- **Route:** `POST /api/invites/bulk`
- **Auth:** Requires authentication (ADMIN or team owner/member)
- **Body:**
  ```json
  {
    "teamId": 1,
    "emails": ["user1@example.com", "user2@example.com", "user3@example.com"]
  }
  ```
- **Validation:**
  - Max 100 emails per request
  - Duplicate emails are automatically deduplicated
  - Already-member emails are filtered out
- **Response:**
  ```json
  {
    "success": true,
    "message": "Bulk invitations sent successfully",
    "batch": {
      "batchId": "batch_uuid",
      "teamId": 1,
      "totalInvites": 3
    },
    "invitedEmails": ["user1@example.com", "user2@example.com", "user3@example.com"],
    "alreadyMembers": [],
    "emailResults": [
      { "email": "user1@example.com", "sent": true },
      { "email": "user2@example.com", "sent": true },
      { "email": "user3@example.com", "sent": false, "error": "..." }
    ]
  }
  ```

#### Accept Bulk Invitation
- **Route:** `POST /api/invites/bulk/accept/:token`
- **Auth:** Requires authentication
- **Body:**
  ```json
  {
    "userId": 123
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Invitation accepted successfully",
    "teamId": 1,
    "teamName": "Team Name",
    "userId": 123
  }
  ```

#### Get Bulk Batch Details
- **Route:** `GET /api/invites/bulk/:batchId`
- **Auth:** Requires authentication
- **Response:**
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
      "status": "ACTIVE"
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

### Key Features
- **Non-blocking Email Sending:** If an email fails to send, the API still succeeds (invitation created, email failed)
- **Deduplication:** Duplicate emails in the request are automatically removed
- **Smart Filtering:** Users already in the team are excluded from invitations
- **Batch Tracking:** Each bulk invite batch is tracked with unique `batch_id`
- **Auto-cleanup:** Expired bulk invites are automatically cleaned up

### Models Used
- `BulkInviteModel`: Handles all bulk invite operations
- `email.service.js`: Enhanced to support bulk email sending

---

## Feature 3: Member-Created Teams & Invitations

### Overview
Regular members can create their own teams and invite others to join. This feature was partially already implemented but is now fully integrated with ownership tracking.

### Key Implementation Details

#### Team Creation by Members
- **Route:** `POST /api/teams` (unchanged)
- **Auth:** Any authenticated user (ADMIN or MEMBER)
- **Behavior:**
  - Member creates a team with themselves as owner
  - Member is automatically added as the first team member
  - Team ownership is tracked (see Feature 1)
  - Member can invite others to their team
- **Request:**
  ```json
  {
    "name": "My Team"
  }
  ```

#### Invitations by Members
- Members can send invitations (single or bulk) to their own teams
- Authorization check: User must be team owner or member
- Full ownership tracking ensures members can only delete/manage their own teams

### Authorization Model
- **Team Creation:** Any user (role doesn't matter)
- **Team Invitations:** Team owner or existing team members can invite
- **Team Deletion:** Only team creator can delete (tracked via ownership)
- **Task Assignment:** Only admins can assign tasks

### Database Integration
- Ownership is tracked at team creation time (role saved: ADMIN or MEMBER)
- Same authorization layer works for both admin and member-created teams
- All team isolation rules apply equally to both team types

---

## Feature 4: Real-Time Team Chat (Socket.IO)

### Overview
Implemented production-ready real-time chat system using Socket.IO with proper message ordering and timestamps.

### Database Changes
- **Updated Table:** `team_chat_messages`
  - Now uses `created_at ASC` ordering (chronological - old to new)
  - Proper indexing for team_id, user_id, created_at

### Key Features

#### Message Ordering
- **Display Order:** Messages displayed oldest to newest (like real chat apps)
- **Database Query:** Changed from DESC to ASC in `ChatModel.findByTeam()`
- **Timestamps:** Actual message creation time (not user creation or join time)

#### Socket.IO Events

##### User Joins Team Chat
```javascript
socket.emit('join_team', {
  teamId: 1,
  userId: 123
});

// Response from server
socket.on('joined_team', {
  teamId: 1,
  room: 'team_1',
  message: 'Successfully joined team chat'
});
```

##### Send Message
```javascript
socket.emit('send_message', {
  teamId: 1,
  userId: 123,
  userName: 'John Doe',
  message: 'Hello team!',
  messageId: 'msg_uuid'
});

// Received by all users in team_1 room
socket.on('new_message', {
  id: 'msg_uuid',
  teamId: 1,
  userId: 123,
  userName: 'John Doe',
  message: 'Hello team!',
  created_at: '2024-01-14T10:30:00Z',
  is_deleted: false
});
```

##### Delete Message
```javascript
socket.emit('delete_message', {
  teamId: 1,
  messageId: 'msg_uuid',
  isHardDelete: false  // soft delete by default
});

// Received by all users in team_1 room
socket.on('message_deleted', {
  messageId: 'msg_uuid',
  teamId: 1,
  isHardDelete: false,
  timestamp: '2024-01-14T10:31:00Z'
});
```

##### Edit Message (New)
```javascript
socket.emit('edit_message', {
  teamId: 1,
  messageId: 'msg_uuid',
  newMessage: 'Updated message'
});

// Received by all users in team_1 room
socket.on('message_edited', {
  messageId: 'msg_uuid',
  teamId: 1,
  newMessage: 'Updated message',
  timestamp: '2024-01-14T10:32:00Z'
});
```

##### User Leaves Team Chat
```javascript
socket.emit('leave_team', {
  teamId: 1,
  userId: 123
});

// Received by all users in team_1 room
socket.on('user_left', {
  userId: 123,
  teamId: 1,
  message: 'A team member left the chat',
  timestamp: '2024-01-14T10:33:00Z'
});
```

### Socket.IO Rooms
- **Room Structure:** `team_{teamId}` (e.g., `team_1`, `team_2`)
- **Isolation:** Messages only broadcast to users in that specific team room
- **No Cross-team Leakage:** Users in different teams receive messages only from their team

---

## Feature 5: Team-Based Chat Isolation

### Overview
Chat functionality is completely isolated per team. No message leakage between teams.

### Isolation Mechanisms

#### 1. Socket.IO Room Isolation
- Each team has its own Socket.IO room: `team_{teamId}`
- Messages broadcast ONLY to users in that specific room
- Leaving a team removes user from the room

#### 2. Database-Level Isolation
- Chat messages stored with `team_id` foreign key
- All queries filter by `team_id`
- Indexes on `team_id` for fast lookups

#### 3. REST API Authorization
- **GET `/api/chat/:teamId`** - Requires user to be team member
- **POST `/api/chat/:teamId`** - Requires user to be team member
- Both endpoints check `TeamModel.isMember()` before returning/storing data

#### 4. Authorization Checks
```javascript
// Check if user is team member or owner
const isMember = await TeamModel.isMember(teamId, userId);
if (!isMember && team.owner_id !== userId) {
  throw new AuthorizationError('You are not a member of this team');
}
```

### Data Isolation
| Aspect | Isolation Method |
|--------|-----------------|
| Messages | Stored with team_id FK, queries filter by team |
| Rooms | Separate Socket.IO room per team |
| Authorization | Membership check before access |
| Broadcast | Only to users in same room |
| Persistence | Team-scoped database queries |

### Testing Isolation
To verify isolation:
1. Create 2 teams
2. Add different users to each team
3. Send message in Team 1 - should not appear in Team 2
4. User in Team 1 cannot see messages from Team 2 (API returns 403)

---

## Database Schema Summary

### New Tables
1. **bulk_invites** - Bulk invite batch tracking
2. **bulk_invite_items** - Individual invite items in batch
3. **team_ownership** - Team creation tracking for authorization
4. **task_ownership** - Task creation tracking for authorization

### Modified Tables
1. **team_chat_messages** - Index optimization, ordering fix

### Key Indexes
- `idx_bulk_invites_batch_id` - Fast batch lookups
- `idx_bulk_invite_items_batch_id` - Fast item lookups by batch
- `idx_team_ownership_creator_id` - Fast ownership lookups by creator
- `idx_task_ownership_creator_id` - Fast ownership lookups by creator

---

## Error Handling

### Common Error Responses

#### Unauthorized Access
```json
{
  "success": false,
  "errorCode": "AUTHORIZATION_ERROR",
  "message": "You are not a member of this team"
}
```
Status: 403

#### Team Not Found
```json
{
  "success": false,
  "errorCode": "NOT_FOUND",
  "message": "Team not found"
}
```
Status: 404

#### Invalid Bulk Invite
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Cannot invite more than 100 users at once"
}
```
Status: 400

---

## Production Readiness Checklist

- ✅ Proper authorization checks on all endpoints
- ✅ Input validation (email, team ID, message length)
- ✅ Error handling with appropriate HTTP status codes
- ✅ Logging for debugging and auditing
- ✅ Database indexes for performance
- ✅ Foreign key cascades for data consistency
- ✅ Non-blocking email sending (doesn't fail API if email fails)
- ✅ Transaction support for multi-step operations
- ✅ Ownership tracking for audit trail
- ✅ Team isolation at Socket.IO and database level
- ✅ Soft delete support for messages

---

## Future Enhancements

1. **Message Reactions** - Add emoji reactions to messages
2. **Message Threading** - Support conversation threads
3. **Message Search** - Full-text search in team messages
4. **Message Persistence** - Archive old messages
5. **Typing Indicators** - Show when users are typing
6. **Read Receipts** - Show when messages are read
7. **Message Attachments** - Support file uploads
8. **Rate Limiting** - Prevent chat spam
9. **Message Encryption** - End-to-end encryption option
10. **Chat Moderation** - Admin moderation tools

---

## Testing Guide

### Manual Testing

#### Test Bulk Invitations
```bash
# Send bulk invitation
curl -X POST http://localhost:5000/api/invites/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "emails": ["test1@example.com", "test2@example.com"]
  }'

# Get batch details
curl -X GET http://localhost:5000/api/invites/bulk/batch_uuid \
  -H "Authorization: Bearer <token>"
```

#### Test Team Deletion
```bash
# Delete team (must be creator)
curl -X DELETE http://localhost:5000/api/teams/1 \
  -H "Authorization: Bearer <token>"
```

#### Test Chat Isolation
```bash
# Get messages from team 1 (must be member)
curl -X GET http://localhost:5000/api/chat/1 \
  -H "Authorization: Bearer <token>"

# Try to access team 2 (should fail if not member)
curl -X GET http://localhost:5000/api/chat/2 \
  -H "Authorization: Bearer <token>"
```

#### Test Socket.IO Chat
```javascript
// In browser console
const socket = io('http://localhost:5000');

// Join team
socket.emit('join_team', { teamId: 1, userId: 123 });

// Send message
socket.emit('send_message', {
  teamId: 1,
  userId: 123,
  userName: 'John',
  message: 'Hello!',
  messageId: 'msg_1'
});

// Listen for messages
socket.on('new_message', (msg) => console.log(msg));
```

---

## Deployment Notes

1. **Database Migration:** Run `init-db.js` to create new tables
2. **Environment Variables:** No new env vars needed
3. **Email Service:** Bulk invites use existing email service (no changes)
4. **Socket.IO CORS:** Already configured for common origins
5. **Backward Compatibility:** All changes are backward compatible

---

## References

- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
