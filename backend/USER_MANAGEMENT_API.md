# User Management API Documentation

## Overview

This document describes the new user management endpoints added to the PERN stack backend. These endpoints enable admins to:
- View all registered users on the platform
- View individual user details
- Check user count/statistics
- Assign existing tasks to users (single or bulk)

## Important Notes

- **All endpoints require authentication** with a valid JWT token
- **All endpoints require ADMIN role** - only users with `role = 'ADMIN'` can access these endpoints
- The existing invitation system and task management remain unchanged
- All user data is read-only (viewing only, no modifications beyond task assignment)

---

## Endpoints

### 1. Get All Users

**Endpoint:** `GET /api/users`

**Authentication:** Required (JWT token)
**Authorization:** ADMIN role required

**Description:** Retrieve a list of all registered users on the platform.

**Request:**
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "count": 5,
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN",
        "created_at": "2025-01-10T10:30:00Z"
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "MEMBER",
        "created_at": "2025-01-11T09:15:00Z"
      },
      // ... more users
    ]
  }
}
```

**Response (Error - Unauthorized):**
```json
{
  "success": false,
  "errorCode": "AUTHORIZATION_ERROR",
  "message": "Access denied. This operation requires one of the following roles: ADMIN"
}
```

---

### 2. Get User Statistics

**Endpoint:** `GET /api/users/stats/count`

**Authentication:** Required (JWT token)
**Authorization:** ADMIN role required

**Description:** Get the total count of registered users on the platform.

**Request:**
```bash
curl -X GET http://localhost:5000/api/users/stats/count \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 5
  }
}
```

---

### 3. Get User Details

**Endpoint:** `GET /api/users/:userId`

**Authentication:** Required (JWT token)
**Authorization:** ADMIN role required

**Parameters:**
- `userId` (path parameter): The ID of the user to retrieve

**Description:** Get detailed information about a specific user.

**Request:**
```bash
curl -X GET http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "MEMBER"
  }
}
```

**Response (Error - User Not Found):**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND_ERROR",
  "message": "User not found"
}
```

---

### 4. Assign Task to Single User

**Endpoint:** `POST /api/users/:userId/assign-task`

**Authentication:** Required (JWT token)
**Authorization:** ADMIN role required

**Parameters:**
- `userId` (path parameter): The ID of the user to assign the task to

**Request Body:**
```json
{
  "taskId": 5
}
```

**Description:** Assign an existing task to a specific user. The task will be reassigned to this user.

**Request:**
```bash
curl -X POST http://localhost:5000/api/users/3/assign-task \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 5
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Task assigned to user successfully",
  "data": {
    "id": 5,
    "title": "Complete Project Report",
    "description": "Prepare and submit the quarterly project report",
    "assigned_to_user_id": 3,
    "assigned_by_user_id": 1,
    "team_id": 2,
    "status": "ASSIGNED",
    "assigned_at": "2025-01-11T14:30:00Z"
  }
}
```

**Response (Error - User Not Found):**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND_ERROR",
  "message": "User not found"
}
```

**Response (Error - Task Not Found):**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND_ERROR",
  "message": "Task not found"
}
```

---

### 5. Assign Task to Multiple Users (Bulk)

**Endpoint:** `POST /api/users/assign-task-bulk`

**Authentication:** Required (JWT token)
**Authorization:** ADMIN role required

**Request Body:**
```json
{
  "taskId": 5,
  "userIds": [2, 3, 4]
}
```

**Description:** Assign an existing task to multiple users. Creates a copy of the task for each user with the same title and description.

**Request:**
```bash
curl -X POST http://localhost:5000/api/users/assign-task-bulk \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 5,
    "userIds": [2, 3, 4]
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Task assigned to 3 user(s) successfully",
  "data": {
    "assignedCount": 3,
    "tasks": [
      {
        "id": 15,
        "title": "Complete Project Report",
        "description": "Prepare and submit the quarterly project report",
        "assigned_to_user_id": 2,
        "assigned_by_user_id": 1,
        "team_id": 2,
        "status": "ASSIGNED",
        "assigned_at": "2025-01-11T14:30:00Z"
      },
      {
        "id": 16,
        "title": "Complete Project Report",
        "description": "Prepare and submit the quarterly project report",
        "assigned_to_user_id": 3,
        "assigned_by_user_id": 1,
        "team_id": 2,
        "status": "ASSIGNED",
        "assigned_at": "2025-01-11T14:30:00Z"
      },
      {
        "id": 17,
        "title": "Complete Project Report",
        "description": "Prepare and submit the quarterly project report",
        "assigned_to_user_id": 4,
        "assigned_by_user_id": 1,
        "team_id": 2,
        "status": "ASSIGNED",
        "assigned_at": "2025-01-11T14:30:00Z"
      }
    ]
  }
}
```

**Response (Error - Invalid Input):**
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Task ID and non-empty user IDs array are required"
}
```

**Response (Error - Task Not Found):**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND_ERROR",
  "message": "Task not found"
}
```

**Response (Error - Some Users Not Found):**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND_ERROR",
  "message": "Users not found: 99, 100"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Status Code | Meaning |
|------------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource successfully created |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Missing or invalid JWT token |
| 403 | Forbidden - Valid token but insufficient permissions (not ADMIN) |
| 404 | Not Found - Requested resource not found |
| 500 | Internal Server Error - Server-side error |

### Error Codes

- `AUTH_MIDDLEWARE_ERROR` - Authentication middleware error
- `AUTHORIZATION_ERROR` - User role is insufficient
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND_ERROR` - Requested resource not found
- `USER_FETCH_ERROR` - Error fetching users list
- `USER_STATS_ERROR` - Error fetching user statistics
- `USER_DETAIL_ERROR` - Error fetching user details
- `TASK_ASSIGNMENT_ERROR` - Error assigning task to user
- `BULK_TASK_ASSIGNMENT_ERROR` - Error in bulk task assignment

---

## Implementation Details

### Database Schema

The system uses the following tables:

**users table:**
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `role` (VARCHAR) - either 'ADMIN' or 'MEMBER'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**tasks table:**
- `id` (SERIAL PRIMARY KEY)
- `title` (VARCHAR)
- `description` (TEXT)
- `status` (VARCHAR) - 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'
- `assigned_to_user_id` (INTEGER FK to users)
- `assigned_by_user_id` (INTEGER FK to users)
- `team_id` (INTEGER FK to teams)
- `assigned_at` (TIMESTAMP)
- `started_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)
- `due_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### New Files Added

1. **src/controllers/user.controller.js** - Contains all user management controller functions
2. **src/routes/user.routes.js** - Defines all user management routes

### Modified Files

1. **src/constants/queries.js** - Added `FIND_ALL` and `COUNT_ALL` queries for users
2. **src/models/user.model.js** - Added `findAll()` and `countAll()` methods
3. **src/models/task.model.js** - Added `assignToUser()` and `assignToMultipleUsers()` methods
4. **src/app.js** - Registered the new user routes

---

## Usage Examples

### Example 1: Admin Dashboard - Get User List

```javascript
async function getUserList(token) {
  const response = await fetch('http://localhost:5000/api/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  const data = await response.json();
  console.log(data.data.users); // Array of all users
}
```

### Example 2: View User Details

```javascript
async function viewUserProfile(userId, token) {
  const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  const data = await response.json();
  console.log(data.data); // User details
}
```

### Example 3: Assign Task to User

```javascript
async function assignTaskToUser(userId, taskId, token) {
  const response = await fetch(`http://localhost:5000/api/users/${userId}/assign-task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId })
  });
  const data = await response.json();
  console.log(data.data); // Updated task
}
```

### Example 4: Bulk Assign Task

```javascript
async function bulkAssignTask(taskId, userIds, token) {
  const response = await fetch('http://localhost:5000/api/users/assign-task-bulk', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, userIds })
  });
  const data = await response.json();
  console.log(data.data.tasks); // Array of created task copies
}
```

---

## Testing the Endpoints

### Prerequisites

1. You need an ADMIN user JWT token
2. You need valid user IDs to test with
3. You need valid task IDs from your database

### Get Admin Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'
```

### Test Get All Users

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Get User Count

```bash
curl -X GET http://localhost:5000/api/users/stats/count \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Bulk Assign

```bash
curl -X POST http://localhost:5000/api/users/assign-task-bulk \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 1,
    "userIds": [2, 3, 4]
  }'
```

---

## Notes for Frontend Integration

1. **Authentication Required**: All requests must include the JWT token in the Authorization header
2. **Admin Only**: Ensure only ADMIN users can access the user management dashboard
3. **Error Handling**: Implement proper error handling for all response codes (401, 403, 404, 500)
4. **Loading States**: The admin dashboard should show loading states while fetching user lists
5. **Pagination**: Consider implementing pagination for large user lists (optional enhancement)
6. **Task Assignment**: When assigning tasks to multiple users, you may want to:
   - Show a confirmation dialog
   - Display progress during bulk assignment
   - Refresh the user/task list after assignment

---

## Security Considerations

1. **Role-Based Access**: Only ADMIN users can access these endpoints
2. **JWT Authentication**: All endpoints require valid, non-expired JWT tokens
3. **Input Validation**: All inputs are validated before processing
4. **SQL Injection Prevention**: Uses parameterized queries via PostgreSQL driver
5. **No Sensitive Data Exposure**: Password hashes are never returned in responses

---

## Performance Notes

- User list queries are indexed on email for fast lookups
- Task assignment uses direct SQL updates for efficiency
- Bulk operations handle multiple users in a single request to reduce API calls
- Consider adding pagination for large user lists as a future enhancement

