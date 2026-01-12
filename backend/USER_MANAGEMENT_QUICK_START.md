# Quick Start Guide - User Management Features

## What's New?

Your backend now has a complete user management system for admins to:
- View all registered users
- Check user statistics
- View individual user details
- Assign tasks to users (single or bulk)

## Getting Started

### 1. Restart Your Backend Server

The new routes have been added to `app.js`. Restart your Node server:

```bash
cd backend
npm start
```

### 2. Test the New Endpoints

You'll need an **ADMIN user JWT token**. Login with an admin account:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Copy the `token` from the response.

### 3. Test Each Endpoint

#### Get All Users
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get User Count
```bash
curl -X GET http://localhost:5000/api/users/stats/count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get Specific User Details
```bash
curl -X GET http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Assign Task to User
```bash
curl -X POST http://localhost:5000/api/users/3/assign-task \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"taskId": 1}'
```

#### Assign Task to Multiple Users
```bash
curl -X POST http://localhost:5000/api/users/assign-task-bulk \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 1,
    "userIds": [2, 3, 4]
  }'
```

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/stats/count` | Get total user count |
| GET | `/api/users/:userId` | Get user details |
| POST | `/api/users/:userId/assign-task` | Assign task to user |
| POST | `/api/users/assign-task-bulk` | Assign task to multiple users |

## Important Notes

✅ **All endpoints require:**
- Valid JWT token in `Authorization: Bearer <token>` header
- ADMIN role

✅ **What wasn't changed:**
- Existing authentication system
- Existing task management
- Existing invitation system
- Any other existing functionality

✅ **Database:**
- No schema changes needed
- Uses existing `users` and `tasks` tables
- Data is read-only (except task assignment)

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Error description"
}
```

## Common Errors

| Error | Solution |
|-------|----------|
| `AUTHORIZATION_ERROR` | User must be ADMIN role |
| `Auth failed: Not authenticated` | Missing or invalid JWT token |
| `NOT_FOUND_ERROR` | User or task doesn't exist |
| `VALIDATION_ERROR` | Invalid input format |

## Files Added/Modified

### New Files
- `src/controllers/user.controller.js` - User management logic
- `src/routes/user.routes.js` - User routes
- `USER_MANAGEMENT_API.md` - Complete documentation

### Modified Files
- `src/app.js` - Added user routes registration
- `src/models/user.model.js` - Added findAll(), countAll()
- `src/models/task.model.js` - Added assignToUser(), assignToMultipleUsers()
- `src/constants/queries.js` - Added user queries

## Next Steps

1. **Review the full API documentation**: See `USER_MANAGEMENT_API.md`
2. **Integrate with frontend**: Create admin dashboard using these endpoints
3. **Test thoroughly**: Use curl or Postman to test all endpoints
4. **Monitor logs**: Check server logs for any issues

## Documentation

- **USER_MANAGEMENT_API.md** - Full API documentation with examples
- **USER_MANAGEMENT_IMPLEMENTATION.md** - Implementation details and notes

## Need Help?

- Refer to `USER_MANAGEMENT_API.md` for endpoint details
- Check controller code: `src/controllers/user.controller.js`
- Review route definitions: `src/routes/user.routes.js`

---

**Everything is ready to use! Start testing with the endpoints above.**
