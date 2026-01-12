# Manual Admin User Setup Guide

## Overview
This guide provides step-by-step instructions to manually create an admin user in the PostgreSQL database using pgAdmin. Admin credentials are no longer hardcoded in environment variables for security reasons.

**Database:** `task-management`  
**Table:** `users`  
**Admin Role:** `ADMIN`

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Before You Start](#before-you-start)
3. [Method 1: Using pgAdmin GUI](#method-1-using-pgadmin-gui)
4. [Method 2: Using SQL Query (Recommended)](#method-2-using-sql-query-recommended)
5. [Method 3: Using Node.js Script](#method-3-using-nodejs-script)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Testing Admin Login](#testing-admin-login)

---

## Prerequisites

### Required Setup
1. ✅ PostgreSQL database is running
2. ✅ `task-management` database has been created
3. ✅ Database schema has been initialized (tables created)
4. ✅ pgAdmin is installed and accessible, OR you have psql CLI access

### Verify Database and Schema
Before creating the admin user, verify the database schema is set up:

```bash
# Open pgAdmin and connect to your PostgreSQL server
# Navigate to: task-management > Schemas > public > Tables
# You should see these tables:
# - users
# - teams
# - team_members
# - tasks
# - invites
```

If tables don't exist, run the backend server once to initialize the schema:
```bash
cd backend
npm run dev
# Wait for: "✅ Database schema initialized successfully"
# Then stop the server (Ctrl+C)
```

---

## Before You Start

### Security Considerations
- ⚠️ **Never use weak passwords** - Use a strong, unique password (minimum 12 characters)
- ⚠️ **Password hashing** - Passwords must be hashed with bcrypt before storing
- ⚠️ **Email uniqueness** - Ensure the email doesn't already exist in the database
- ⚠️ **Role assignment** - Set role to exactly `'ADMIN'` (case-sensitive)

### Choose Your Admin Credentials
Decide on the following before proceeding:
```
Email: admin@example.com (or your preferred email)
Name: Administrator (or your preferred name)
Password: YourStrongPassword123! (must be strong)
```

---

## Method 1: Using pgAdmin GUI

### Step 1: Generate Password Hash

First, you need to generate a bcrypt hash of your password. You have two options:

**Option A: Quick Online (⚠️ Only if you trust the site)**
Use an online bcrypt generator (search "bcrypt online generator")

**Option B: Using Node.js (Recommended - Keep it secure)**
```bash
# Open Node.js REPL
node

# In the Node.js console, run:
const bcrypt = require('bcrypt');
bcrypt.hash('YourStrongPassword123!', 10).then(hash => console.log(hash));

# Example output: $2b$10$abcdef1234567890abcdef...
# Copy this hash for the next step
```

### Step 2: Open pgAdmin

1. Open pgAdmin in your browser (usually `http://localhost:5050`)
2. Log in with your pgAdmin credentials
3. Navigate to: **Servers** → **PostgreSQL** → **Databases** → **task-management** → **Schemas** → **public** → **Tables** → **users**

### Step 3: Insert Admin User

1. Right-click on **users** table → **Scripts** → **INSERT Script**
2. You'll see a template. Modify it to:

```sql
INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
VALUES (
  'Administrator',
  'admin@example.com',
  '$2b$10$<PASTE_YOUR_BCRYPT_HASH_HERE>',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

3. Replace:
   - `'Administrator'` with your admin name
   - `'admin@example.com'` with your admin email
   - `'$2b$10$<PASTE_YOUR_BCRYPT_HASH_HERE>'` with the bcrypt hash from Step 1

4. Click **Execute** button

### Step 4: Verify

Run this query to verify the admin was created:
```sql
SELECT id, name, email, role, created_at FROM users WHERE role = 'ADMIN';
```

You should see one row with your admin information.

---

## Method 2: Using SQL Query (Recommended)

### Step 1: Generate Password Hash

Using Node.js (most secure):
```bash
node

# In the Node.js console:
const bcrypt = require('bcrypt');
bcrypt.hash('YourStrongPassword123!', 10).then(hash => console.log(hash));
```

**Example:**
```
Input Password: MySecureAdminPass2025!
Generated Hash: $2b$10$NXkw7K.vMm4Y5xZfL9eKSe0W7VR3zQ2m1p8dB4jXyHzL2t9r3c6Nq
```

### Step 2: Execute INSERT Query

Open pgAdmin Query Tool and run:

```sql
INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
VALUES (
  'Administrator',
  'admin@example.com',
  '$2b$10$NXkw7K.vMm4Y5xZfL9eKSe0W7VR3zQ2m1p8dB4jXyHzL2t9r3c6Nq',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

**Expected Output:**
```
INSERT 0 1
(Successfully inserted 1 row)
```

### Step 3: Verify Admin User

Run this verification query:
```sql
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@example.com';
```

**Expected Output:**
```
 id |      name       |        email        | role  |        created_at
----+-----------------+---------------------+-------+------------------------
  1 | Administrator   | admin@example.com   | ADMIN | 2026-01-11 14:30:00
```

---

## Method 3: Using Node.js Script

### Step 1: Create a Setup Script

Create a file: `backend/scripts/create-admin.js`

```javascript
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    // Admin credentials - CHANGE THESE!
    const adminEmail = 'admin@example.com';
    const adminName = 'Administrator';
    const adminPassword = 'YourStrongPassword123!';
    
    // Validate inputs
    if (!adminEmail || !adminName || !adminPassword) {
      console.error('❌ Admin credentials not provided');
      process.exit(1);
    }
    
    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.error('❌ Admin user with this email already exists');
      process.exit(1);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Insert admin user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, role`,
      [adminName, adminEmail, passwordHash, 'ADMIN']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('\nAdmin Details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Name: ${result.rows[0].name}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Role: ${result.rows[0].role}`);
    console.log('\nYou can now login with:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

createAdmin();
```

### Step 2: Update package.json

Add this script to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "node src/server.js",
    "create-admin": "node scripts/create-admin.js"
  }
}
```

### Step 3: Run the Script

```bash
cd backend
npm run create-admin
```

**Expected Output:**
```
✅ Admin user created successfully!

Admin Details:
  ID: 1
  Name: Administrator
  Email: admin@example.com
  Role: ADMIN

You can now login with:
  Email: admin@example.com
  Password: YourStrongPassword123!
```

---

## Verification

### Query 1: Check All Users
```sql
SELECT id, name, email, role FROM users;
```

### Query 2: Check Admin Users Only
```sql
SELECT id, name, email, role, created_at FROM users WHERE role = 'ADMIN';
```

### Query 3: Verify Email Uniqueness
```sql
SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1;
```

### Query 4: Check Password Hash Format
```sql
SELECT id, email, LENGTH(password_hash) as hash_length FROM users;
```

The password hash should be approximately 60 characters long (bcrypt standard).

---

## Troubleshooting

### Issue: "duplicate key value violates unique constraint"
**Problem:** Email already exists in the database

**Solution:**
1. Check if user exists:
```sql
SELECT * FROM users WHERE email = 'admin@example.com';
```

2. Either use a different email or delete the existing user first:
```sql
DELETE FROM users WHERE email = 'admin@example.com';
-- Then retry the INSERT query
```

### Issue: "UNIQUE constraint failed on email"
**Problem:** The UNIQUE constraint on email column is preventing duplicate

**Solution:** Same as above - use a unique email address

### Issue: "INSERT INTO users ... column ... doesn't exist"
**Problem:** Database schema tables weren't created

**Solution:**
1. Start the backend server to initialize schema:
```bash
cd backend
npm run dev
# Wait for "✅ Database schema initialized successfully"
# Stop the server (Ctrl+C)
```

2. Then retry the INSERT query

### Issue: "Invalid password hash format"
**Problem:** Password wasn't properly hashed with bcrypt

**Solution:**
1. Generate hash correctly using the Node.js command:
```bash
node
const bcrypt = require('bcrypt');
bcrypt.hash('YourPassword', 10).then(hash => console.log(hash));
```

2. Make sure the hash starts with `$2b$` or `$2a$`

### Issue: "Login fails with wrong password even with correct password"
**Problem:** Password wasn't hashed or hash is corrupted

**Solution:**
1. Verify the password hash is correct:
```sql
SELECT password_hash FROM users WHERE email = 'admin@example.com';
```

2. Hash should look like: `$2b$10$NXkw7K.vMm4Y5xZfL9eKSe0W7VR...` (60 chars)

3. If hash is wrong, delete and recreate the user with correct hash

---

## Testing Admin Login

### Method 1: Using cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourStrongPassword123!"
  }'
```

**Expected Response (Status: 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Method 2: Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:5000/api/auth/login`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "email": "admin@example.com",
     "password": "YourStrongPassword123!"
   }
   ```
5. **Click Send**
6. **Expected Status:** 200 OK

### Method 3: Using Browser Dev Tools

```javascript
// Open browser console and run:
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'YourStrongPassword123!'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Troubleshooting Login

| Problem | Solution |
|---------|----------|
| 401 - Invalid email or password | Check email exists and password is correct |
| 500 - Server error | Check backend logs, ensure database is connected |
| 400 - Email validation error | Use a valid email format |

---

## Quick Reference

### Password Hash Generation
```bash
# Using Node.js REPL
node
const bcrypt = require('bcrypt');
bcrypt.hash('YourPassword', 10).then(hash => console.log(hash));
```

### Create Admin (Single SQL Command)
```sql
INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
VALUES (
  'Administrator',
  'admin@example.com',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

### Verify Admin Exists
```sql
SELECT * FROM users WHERE role = 'ADMIN';
```

### Update Admin Password (if needed)
```bash
# Generate new hash first
node
const bcrypt = require('bcrypt');
bcrypt.hash('NewPassword', 10).then(hash => console.log(hash));
```

```sql
UPDATE users 
SET password_hash = '$2b$10$NEW_HASH_HERE'
WHERE email = 'admin@example.com';
```

### Delete Admin User (if needed)
```sql
DELETE FROM users WHERE email = 'admin@example.com';
```

---

## Summary

✅ **Admin setup is now manual and secure**
- No hardcoded credentials in .env
- Admin user stored in database like any other user
- Passwords properly hashed with bcrypt
- Multiple setup methods available

✅ **Follow these steps:**
1. Decide on admin email and password
2. Generate bcrypt hash of password
3. Insert admin user into database using SQL
4. Verify admin was created
5. Test login

✅ **Admin user works like any other user:**
- Logs in through normal `/api/auth/login` endpoint
- Gets JWT token same as regular users
- Has `role: 'ADMIN'` to indicate administrative access
- Can create teams, assign tasks, manage invites, etc.

---

## Additional Resources

### Documentation Files
- `API_TESTING_GUIDE.md` - API endpoint testing guide
- `README.md` - Backend setup and running
- `.env.example` - Environment variable template (if available)

### Related Endpoints
- `POST /api/auth/login` - Login with admin credentials
- `POST /api/auth/signup` - Create regular user accounts
- `GET /api/teams` - Get admin's teams
- `POST /api/teams` - Create teams as admin

### Security Best Practices
- Use strong passwords (12+ characters with mixed case, numbers, symbols)
- Never commit .env with hardcoded credentials
- Rotate admin password periodically
- Use environment variables only for non-sensitive config
- Enable HTTPS in production

---

**Last Updated:** January 11, 2026  
**Version:** 1.0  
**Status:** ✅ Manual Admin Setup Ready

For issues or questions, check the [Troubleshooting](#troubleshooting) section above.
