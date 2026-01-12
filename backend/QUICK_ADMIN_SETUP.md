# Quick Start: Manual Admin Setup

## 🚀 TL;DR - Create Admin in 5 Minutes

### Step 1: Generate Password Hash (1 minute)
```bash
node
# In Node.js console:
const bcrypt = require('bcrypt');
bcrypt.hash('YourAdminPassword123!', 10).then(hash => console.log(hash));
# Copy the output (e.g., $2b$10$ABC...)
```

### Step 2: Create Admin in Database (1 minute)
Open pgAdmin → Query Tool → Run this SQL:

```sql
INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
VALUES ('Administrator', 'admin@example.com', '$2b$10$PASTE_HASH_HERE', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### Step 3: Verify Admin Created (1 minute)
```sql
SELECT * FROM users WHERE role = 'ADMIN';
```

### Step 4: Test Login (1 minute)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourAdminPassword123!"}'
```

### Step 5: Check Response (1 minute)
Should return:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

---

## ⚠️ Important Notes

- **Email must be unique** in database
- **Password must be hashed** with bcrypt (not plain text)
- **Role must be** exactly `'ADMIN'` (case-sensitive)
- **Hash must start** with `$2b$10` or `$2a$` (60 characters)

---

## 🔧 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "duplicate key" error | Email already exists - use different email |
| Login fails | Check password hash is correct with `bcrypt.compare()` |
| Table doesn't exist | Start backend server once: `npm run dev` |
| Wrong hash format | Hash must be 60 chars starting with `$2b$` |

---

## 📚 Full Documentation

For detailed instructions with multiple methods, see:
- `database/ADMIN_SETUP_QUERIES.md` - Complete guide with 3 methods
- `ADMIN_REMOVAL_SUMMARY.md` - Overview of changes made

---

**Status:** ✅ Ready to create admin
