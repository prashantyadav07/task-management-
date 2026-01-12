# API Testing Guide - Step by Step

## Overview
This guide provides step-by-step instructions to test all API endpoints of the PERN Stack Task Management System.

**Base URL:** `http://localhost:5000/api`  
**Server Status:** Running on port 5000  
**Database:** PostgreSQL (task-management)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Authentication APIs](#authentication-apis)
3. [Team Management APIs](#team-management-apis)
4. [Task Management APIs](#task-management-apis)
5. [Invitation APIs](#invitation-apis)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Start the Server
```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Database connected
✅ Database schema verified/initialized
✅ Server started successfully
✅ Backend running perfectly
```

### Tools You'll Need
- `curl` command (built into most systems)
- Or use Postman/Insomnia
- Text editor for saving responses

---

## Authentication APIs

### Step 1: Admin Login
**Purpose:** Get JWT token for authenticated requests

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin@123"
  }'
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "ADMIN",
    "name": "Administrator",
    "email": "admin@gmail.com",
    "role": "ADMIN"
  }
}
```

**⚠️ IMPORTANT:** Copy the token value for use in next steps!

```bash
# Save token for easy reference
TOKEN="<paste_token_here>"
```

**✅ Verification:**
- [ ] Status is 200
- [ ] Token is provided
- [ ] User role is ADMIN
- [ ] Email is admin@gmail.com

---

### Step 2: New User Signup
**Purpose:** Register a new user without invitation

**Endpoint:** `POST /api/auth/signup`

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "SecurePass@123"
  }'
```

**Expected Response (Status: 201):**
```json
{
  "success": true,
  "message": "Signup successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "MEMBER"
  }
}
```

**✅ Verification:**
- [ ] Status is 201 (Created)
- [ ] New user ID is provided
- [ ] User role is MEMBER
- [ ] Email matches what was sent

---

### Step 3: Test Duplicate Email Protection (FIX VERIFIED)
**Purpose:** Verify that duplicate emails are rejected

**Endpoint:** `POST /api/auth/signup`

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "Another User",
    "password": "SecurePass@123"
  }'
```

**Expected Response (Status: 400):**
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "User with this email already exists"
}
```

**✅ Verification:**
- [ ] Status is 400 (Bad Request) - NOT 201!
- [ ] Error message says email already exists
- [ ] This confirms CRITICAL FIX #1 is working

---

### Step 4: Login with Wrong Password
**Purpose:** Verify authentication validation

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (Status: 401):**
```json
{
  "success": false,
  "errorCode": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password"
}
```

**✅ Verification:**
- [ ] Status is 401 (Unauthorized)
- [ ] Error message is generic (for security)
- [ ] Access is denied

---

## Team Management APIs

### Step 5: Get All Teams
**Purpose:** Retrieve teams for logged-in user

**Endpoint:** `GET /api/teams`

```bash
curl -X GET http://localhost:5000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "teams": []
}
```

**⚠️ NOTE:** First time will return empty array (no teams yet)

**✅ Verification:**
- [ ] Status is 200 (NOT 500!) - CRITICAL FIX #2 verified
- [ ] Response includes teams array
- [ ] Array is empty initially

---

### Step 6: Create a Team
**Purpose:** Create a new team

**Endpoint:** `POST /api/teams`

```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Development Team",
    "description": "Team for development work"
  }'
```

**Expected Response (Status: 201):**
```json
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "id": 1,
    "name": "Development Team",
    "owner_id": "ADMIN"
  }
}
```

**⚠️ IMPORTANT:** Save the team ID for next steps!

```bash
TEAM_ID=1  # Use the actual ID from response
```

**✅ Verification:**
- [ ] Status is 201 (Created) - CRITICAL FIX #2 verified
- [ ] Team ID is provided
- [ ] Team name matches
- [ ] Owner is ADMIN

---

### Step 7: Get Teams Again
**Purpose:** Verify team was created

**Endpoint:** `GET /api/teams`

```bash
curl -X GET http://localhost:5000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "teams": [
    {
      "id": 1,
      "name": "Development Team",
      "owner_id": "ADMIN"
    }
  ]
}
```

**✅ Verification:**
- [ ] Status is 200
- [ ] Teams array now contains 1 team
- [ ] Team details match what was created

---

### Step 8: Get Team Members
**Purpose:** Get all members of a team

**Endpoint:** `GET /api/teams/{id}/members`

```bash
curl -X GET http://localhost:5000/api/teams/1/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Team members retrieved successfully",
  "members": [
    {
      "id": "ADMIN",
      "name": "Administrator",
      "email": "admin@gmail.com"
    }
  ]
}
```

**✅ Verification:**
- [ ] Status is 200
- [ ] Members array includes the team owner
- [ ] Admin user is listed as member

---

## Task Management APIs

### Step 9: Create a Task
**Purpose:** Create a new task and assign it

**Endpoint:** `POST /api/tasks`

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Implement login feature",
    "description": "Create user authentication system",
    "assignedToUserId": "ADMIN",
    "teamId": 1,
    "dueDate": "2025-12-31"
  }'
```

**Expected Response (Status: 201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Implement login feature",
    "description": "Create user authentication system",
    "status": "ASSIGNED",
    "assigned_to_user_id": "ADMIN",
    "assigned_by_user_id": "ADMIN",
    "team_id": 1,
    "assigned_at": "2026-01-11T13:45:00.000Z"
  }
}
```

**⚠️ IMPORTANT:** Save the task ID!

```bash
TASK_ID=1  # Use the actual ID from response
```

**✅ Verification:**
- [ ] Status is 201 (Created)
- [ ] Task ID is provided
- [ ] Status is "ASSIGNED"
- [ ] Task is assigned to correct user
- [ ] Team ID matches

---

### Step 10: Get My Tasks
**Purpose:** Get all tasks assigned to logged-in user

**Endpoint:** `GET /api/tasks/my-tasks`

```bash
curl -X GET http://localhost:5000/api/tasks/my-tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "tasks": [
    {
      "id": 1,
      "title": "Implement login feature",
      "status": "ASSIGNED",
      "assigned_to_user_id": "ADMIN",
      "team_id": 1,
      "assigned_at": "2026-01-11T13:45:00.000Z"
    }
  ]
}
```

**✅ Verification:**
- [ ] Status is 200 (NOT 500!) - CRITICAL FIX #2 verified
- [ ] Tasks array contains the created task
- [ ] Task details are correct

---

### Step 11: Get Team Tasks
**Purpose:** Get all tasks for a specific team

**Endpoint:** `GET /api/tasks/team/{teamId}`

```bash
curl -X GET http://localhost:5000/api/tasks/team/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Team tasks retrieved successfully",
  "tasks": [
    {
      "id": 1,
      "title": "Implement login feature",
      "status": "ASSIGNED",
      "team_id": 1,
      "assigned_at": "2026-01-11T13:45:00.000Z"
    }
  ]
}
```

**✅ Verification:**
- [ ] Status is 200
- [ ] Tasks array contains team task
- [ ] Team ID matches filter

---

### Step 12: Start a Task
**Purpose:** Change task status from ASSIGNED to IN_PROGRESS

**Endpoint:** `PUT /api/tasks/{id}/start`

```bash
curl -X PUT http://localhost:5000/api/tasks/1/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Task started successfully",
  "data": {
    "id": 1,
    "title": "Implement login feature",
    "status": "IN_PROGRESS",
    "started_at": "2026-01-11T13:46:00.000Z"
  }
}
```

**✅ Verification:**
- [ ] Status is 200 (OK)
- [ ] Task status changed to "IN_PROGRESS"
- [ ] Started time is recorded

---

### Step 13: Complete a Task
**Purpose:** Change task status from IN_PROGRESS to COMPLETED

**Endpoint:** `PUT /api/tasks/{id}/complete`

```bash
curl -X PUT http://localhost:5000/api/tasks/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "data": {
    "id": 1,
    "title": "Implement login feature",
    "status": "COMPLETED",
    "completed_at": "2026-01-11T13:47:00.000Z",
    "time_in_minutes": 1.5
  }
}
```

**✅ Verification:**
- [ ] Status is 200 (OK)
- [ ] Task status changed to "COMPLETED"
- [ ] Completed time is recorded
- [ ] Time taken is calculated

---

## Invitation APIs

### Step 14: Send Invitation
**Purpose:** Invite a new user to a team

**Endpoint:** `POST /api/invites`

```bash
curl -X POST http://localhost:5000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "newmember@example.com",
    "teamId": 1
  }'
```

**Expected Response (Status: 201):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": 1,
    "email": "newmember@example.com",
    "team_id": 1,
    "token": "inv_abc123def456...",
    "status": "PENDING",
    "expires_at": "2026-01-12T13:47:00.000Z"
  }
}
```

**⚠️ IMPORTANT:** The token would be sent to the user's email

**✅ Verification:**
- [ ] Status is 201 (Created)
- [ ] Invitation has unique token
- [ ] Status is "PENDING"
- [ ] Expiration time is set

---

## Authentication Tests

### Step 15: Test Without Token
**Purpose:** Verify protected endpoints require authentication

**Endpoint:** `GET /api/teams` (without token)

```bash
curl -X GET http://localhost:5000/api/teams \
  -H "Content-Type: application/json"
```

**Expected Response (Status: 401):**
```json
{
  "success": false,
  "errorCode": "AUTHENTICATION_ERROR",
  "message": "Access denied. No token provided."
}
```

**✅ Verification:**
- [ ] Status is 401 (Unauthorized)
- [ ] Clear error message
- [ ] Access is denied

---

### Step 16: Test Invalid Endpoint
**Purpose:** Verify 404 error handling

**Endpoint:** `GET /api/invalid-endpoint`

```bash
curl -X GET http://localhost:5000/api/invalid-endpoint \
  -H "Content-Type: application/json"
```

**Expected Response (Status: 404):**
```json
{
  "success": false,
  "errorCode": "ROUTE_NOT_FOUND",
  "message": "The requested GET /api/invalid-endpoint does not exist"
}
```

**✅ Verification:**
- [ ] Status is 404 (Not Found)
- [ ] Error message shows the invalid path
- [ ] Proper error format

---

## Complete Test Summary

### ✅ All Tests Overview

| # | Test | Endpoint | Method | Status | Result |
|---|------|----------|--------|--------|--------|
| 1 | Admin Login | /auth/login | POST | 200 | ✅ |
| 2 | New User Signup | /auth/signup | POST | 201 | ✅ |
| 3 | Duplicate Email | /auth/signup | POST | 400 | ✅ FIXED |
| 4 | Wrong Password | /auth/login | POST | 401 | ✅ |
| 5 | Get Teams | /teams | GET | 200 | ✅ FIXED |
| 6 | Create Team | /teams | POST | 201 | ✅ FIXED |
| 7 | Get Teams Again | /teams | GET | 200 | ✅ |
| 8 | Get Team Members | /teams/:id/members | GET | 200 | ✅ |
| 9 | Create Task | /tasks | POST | 201 | ✅ |
| 10 | Get My Tasks | /tasks/my-tasks | GET | 200 | ✅ FIXED |
| 11 | Get Team Tasks | /tasks/team/:id | GET | 200 | ✅ |
| 12 | Start Task | /tasks/:id/start | PUT | 200 | ✅ |
| 13 | Complete Task | /tasks/:id/complete | PUT | 200 | ✅ |
| 14 | Send Invitation | /invites | POST | 201 | ✅ |
| 15 | No Token Test | /teams | GET | 401 | ✅ |
| 16 | Invalid Endpoint | /invalid-endpoint | GET | 404 | ✅ |

---

## Troubleshooting

### Issue: Server Not Running
```
curl: (7) Failed to connect to localhost port 5000
```

**Solution:**
```bash
# Start the server
cd backend
npm run dev

# Wait for this message:
# ✅ Server started successfully
```

---

### Issue: Database Connection Error
```
✅ Database connected
[ERROR] Failed to connect to database
```

**Solution:**
1. Verify PostgreSQL is running
2. Check .env file has correct credentials
3. Verify database 'task-management' exists

---

### Issue: Invalid Token
```json
{
  "errorCode": "AUTHENTICATION_ERROR",
  "message": "Invalid token"
}
```

**Solution:**
1. Get new token from Step 1 (Admin Login)
2. Copy entire token value
3. Use in Authorization header: `Bearer $TOKEN`

---

### Issue: User Already Exists
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "User with this email already exists"
}
```

**Solution:**
Use a different email for signup, or create account with:
```bash
email: "user$(date +%s)@example.com"
```

---

### Issue: Team Not Found
```json
{
  "errorCode": "TEAM_NOT_FOUND",
  "message": "Team not found"
}
```

**Solution:**
1. Create a team first (Step 6)
2. Use correct team ID from response

---

### Issue: Task Not Found
```json
{
  "errorCode": "TASK_NOT_FOUND",
  "message": "Task not found"
}
```

**Solution:**
1. Create a task first (Step 9)
2. Use correct task ID from response

---

## Quick Command Reference

### Save Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin@123"}' \
  | jq -r '.token')

echo "Token saved: $TOKEN"
```

### Verify Server
```bash
curl -s http://localhost:5000/api/teams \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Run All Tests
```bash
# Run the comprehensive test script
node comprehensive_test.mjs

# Or run critical fixes test
node test_critical_fixes.mjs
```

---

## API Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Human readable error message"
}
```

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Invalid endpoint/resource |
| 500 | Server Error | Unhandled exceptions |

---

## Summary

✅ **16 API Tests Covered**
- Authentication (4 tests)
- Teams (4 tests)
- Tasks (5 tests)
- Invitations (1 test)
- Error Handling (2 tests)

✅ **2 Critical Fixes Verified**
- Duplicate Email Prevention
- Database Query Functionality

✅ **All Tests Should Pass**
- If any test fails, check Troubleshooting section
- Server logs will show detailed error messages

---

## Next Steps

1. ✅ Run through all 16 tests step by step
2. ✅ Verify all responses match expected
3. ✅ Check server logs for any issues
4. ✅ Deploy to staging environment
5. ✅ Run load testing
6. ✅ Deploy to production

---

**Last Updated:** January 11, 2026  
**API Version:** 1.0  
**Status:** ✅ All Critical Issues Fixed

For more details, see:
- API_TESTING_REPORT.md - Detailed test results
- IMPLEMENTATION_REPORT.md - Implementation details
- CODE_CHANGES_SUMMARY.md - Code modifications

