# Backend API Reference Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. TEAM CHAT ENDPOINTS

### Get Team Messages
```http
GET /chat/:teamId?limit=100&offset=0
Authorization: Bearer <token>
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
        "user_id": 5,
        "message": "Hello team!",
        "created_at": "2026-01-13T10:30:00Z",
        "is_deleted": false,
        "user_name": "John Doe",
        "user_email": "john@example.com"
      }
    ],
    "count": 1
  }
}
```

### Send Message
```http
POST /chat/:teamId
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "This is a team message"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 1,
    "team_id": 1,
    "user_id": 5,
    "message": "This is a team message",
    "created_at": "2026-01-13T10:30:00Z",
    "is_deleted": false
  }
}
```

### Delete Message
```http
DELETE /chat/message/:messageId?hard=false
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    "success": true,
    "messageId": 1
  }
}
```

---

## 2. TASK MANAGEMENT ENDPOINTS

### Create Task (Admin Only)
```http
POST /tasks
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "assignedToUserId": 5,
  "teamId": 1
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "task": {
    "id": 10,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "assigned_to_user_id": 5,
    "assigned_by_user_id": 1,
    "team_id": 1,
    "status": "ASSIGNED",
    "assigned_at": "2026-01-13T10:30:00Z"
  }
}
```

### Create Task (Member for Own Team)
```http
POST /tasks/member/create
Authorization: Bearer <member_token>
Content-Type: application/json

{
  "title": "Team meeting notes",
  "description": "Document action items from meeting",
  "teamId": 1,
  "assignedToUserId": 5,
  "dueDate": "2026-01-15T18:00:00Z"
}
```

### Get My Tasks
```http
GET /tasks/my-tasks
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "tasks": [
    {
      "id": 10,
      "title": "Complete project documentation",
      "status": "IN_PROGRESS",
      "assigned_at": "2026-01-13T10:30:00Z"
    }
  ]
}
```

### Get Team Tasks
```http
GET /tasks/team/:teamId
Authorization: Bearer <token>
```

### Start Task
```http
PUT /tasks/:taskId/start
Authorization: Bearer <token>
```
**Response (200):** Task with status changed to IN_PROGRESS

### Complete Task
```http
PUT /tasks/:taskId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "lateSubmissionReason": "Waiting for client feedback" // Optional, required if task is late
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "task": {
    "id": 10,
    "status": "COMPLETED",
    "completed_at": "2026-01-13T15:00:00Z",
    "completed_by_user_id": 5
  },
  "auditInfo": {
    "isLateSubmission": false,
    "dueDate": "2026-01-15T18:00:00Z",
    "completedAt": "2026-01-13T15:00:00Z",
    "completedBy": 5
  }
}
```

**Error (400) - Late Submission:**
```json
{
  "success": false,
  "errorCode": "LATE_SUBMISSION_REASON_REQUIRED",
  "message": "This task is past the deadline. Please provide a reason for late submission.",
  "data": {
    "isLate": true,
    "dueDate": "2026-01-12T18:00:00Z"
  }
}
```

### Get Task Details with Audit Trail
```http
GET /tasks/:taskId/details
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "success": true,
  "message": "Task details retrieved successfully",
  "data": {
    "task": {
      "id": 10,
      "title": "Complete project documentation",
      "status": "COMPLETED",
      "created_at": "2026-01-10T09:00:00Z",
      "assigned_at": "2026-01-10T09:00:00Z",
      "started_at": "2026-01-11T08:30:00Z",
      "completed_at": "2026-01-13T15:00:00Z",
      "due_date": "2026-01-15T18:00:00Z",
      "late_submission_reason": null,
      "assigned_to_name": "John Doe",
      "assigned_by_name": "Admin User",
      "completed_by_name": "John Doe",
      "is_late_submission": false
    },
    "auditTrail": {
      "created": "Task created on 1/10/2026 at 9:00:00 AM",
      "assigned": "Assigned on 1/10/2026 at 9:00:00 AM by Admin User",
      "started": "Started on 1/11/2026 at 8:30:00 AM",
      "completed": "Completed on 1/13/2026 at 3:00:00 PM by John Doe",
      "isLateSubmission": false,
      "lateReason": null
    }
  }
}
```

### Delete Task (Admin Only)
```http
DELETE /tasks/:taskId?hard=false
Authorization: Bearer <admin_token>
```
**Parameters:**
- `hard=true` - Hard delete (permanent removal)
- `hard=false` (default) - Soft delete (mark as deleted)

### Assign Task to Multiple Members (Member)
```http
POST /tasks/member/assign-multiple
Authorization: Bearer <member_token>
Content-Type: application/json

{
  "taskId": 10,
  "memberIds": [5, 6, 7]
}
```

---

## 3. TEAM MANAGEMENT ENDPOINTS

### Create Team (Any User)
```http
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marketing Team"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "id": 1,
    "name": "Marketing Team",
    "owner_id": 5,
    "created_at": "2026-01-13T10:30:00Z"
  }
}
```

### Get My Teams
```http
GET /teams
Authorization: Bearer <token>
```

### Get Team Members
```http
GET /teams/:teamId/members
Authorization: Bearer <token>
```

---

## 4. INVITATION ENDPOINTS

### Send Invitation (Admin or Team Member)
```http
POST /invites
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "teamId": 1
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invite": {
    "email": "newmember@example.com",
    "teamId": 1,
    "expiresAt": "2026-01-14T10:30:00Z"
  }
}
```

---

## 5. USER MANAGEMENT ENDPOINTS (Admin Only)

### Get All Users
```http
GET /users
Authorization: Bearer <admin_token>
```

### Get User Details
```http
GET /users/:userId
Authorization: Bearer <admin_token>
```

### Get User Statistics
```http
GET /users/stats/count
Authorization: Bearer <admin_token>
```

### Delete Member (Admin Only)
```http
DELETE /users/:userId?hard=true
Authorization: Bearer <admin_token>
```
**Parameters:**
- `hard=true` - Hard delete with cascade (removes all member data)

**Response (200):**
```json
{
  "success": true,
  "message": "Member deleted successfully",
  "data": {
    "success": true,
    "userId": 5,
    "method": "hard_delete"
  }
}
```

**Cascade Deletion includes:**
- All tasks (created, assigned, completed)
- All team memberships
- All chat messages
- All pending invitations
- All teams owned by member

---

## 6. SOCKET.IO EVENTS

### Connect
```javascript
// Client joins team chat
socket.emit('join_team', teamId);

// Server response
socket.on('user_joined', (data) => {
  console.log(data.message); // "A user joined the team chat"
});
```

### Send Message
```javascript
socket.emit('send_message', {
  teamId: 1,
  userId: 5,
  message: 'Hello team!',
  messageId: 123,
  userName: 'John Doe'
});

// Receive on all team members
socket.on('new_message', (data) => {
  console.log(data.message);
  console.log('From:', data.userName);
});
```

### Delete Message
```javascript
socket.emit('delete_message', {
  teamId: 1,
  messageId: 123,
  isHardDelete: false
});

// Receive on all team members
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

### Leave Team
```javascript
socket.emit('leave_team', teamId);

socket.on('user_left', (data) => {
  console.log(data.message); // "A user left the team chat"
});
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "errorCode": "ERROR_TYPE",
  "message": "Human-readable error message"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND_ERROR` - Resource not found
- `AUTHORIZATION_ERROR` - User not authorized
- `AUTHENTICATION_ERROR` - Invalid credentials
- `DATABASE_ERROR` - Database operation failed
- `LATE_SUBMISSION_REASON_REQUIRED` - Need reason for late submission
- `TASK_NOT_FOUND` - Task doesn't exist
- `TEAM_NOT_FOUND` - Team doesn't exist
- `MESSAGE_NOT_FOUND` - Message doesn't exist

---

## Example: Complete Task Submission Flow

### 1. Get task details to check deadline
```http
GET /tasks/10/details
Authorization: Bearer <token>
```

### 2. Start task
```http
PUT /tasks/10/start
Authorization: Bearer <token>
```

### 3. Complete task (check if late)
```http
PUT /tasks/10/complete
Authorization: Bearer <token>

{
  "lateSubmissionReason": "Reason if late"
}
```

### 4. View audit trail
```http
GET /tasks/10/details
Authorization: Bearer <token>
```

---

## Testing Tips

1. **Use Postman/Insomnia** for REST endpoints
2. **Use Socket.io client** for real-time chat:
   ```javascript
   import { io } from 'socket.io-client';
   const socket = io('http://localhost:5000');
   ```
3. **Test with different user roles** (ADMIN vs MEMBER)
4. **Check email logs** for invitation emails
5. **Monitor server logs** for Socket.io events

