/**
 * Database Sample Data Insertion Script
 * Inserts sample data including tasks for testing the admin dashboard
 * Run: node insert-sample-data.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const insertSampleData = async () => {
  const client = await pool.connect();
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         INSERTING SAMPLE DATA                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Check if admin exists, if not create it
    console.log('1️⃣  Checking admin user...');
    const adminResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@example.com']
    );

    let adminId;
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].id;
      console.log(`   ✅ Admin found (ID: ${adminId})\n`);
    } else {
      console.log('   ❌ Admin not found, skipping sample data insertion\n');
      console.log('   Please run the server first to bootstrap the admin user\n');
      client.release();
      await pool.end();
      process.exit(1);
    }

    // 2. Create a team if not exists
    console.log('2️⃣  Creating team...');
    const teamResult = await client.query(
      'SELECT * FROM teams WHERE name = $1 LIMIT 1',
      ['Sample Team']
    );

    let teamId;
    if (teamResult.rows.length > 0) {
      teamId = teamResult.rows[0].id;
      console.log(`   ✅ Team exists (ID: ${teamId})\n`);
    } else {
      const newTeam = await client.query(
        'INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING id',
        ['Sample Team', adminId]
      );
      teamId = newTeam.rows[0].id;
      console.log(`   ✅ Team created (ID: ${teamId})\n`);
    }

    // 3. Create some member users
    console.log('3️⃣  Creating member users...');
    const memberEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
    const memberIds = [];

    for (const email of memberEmails) {
      const userCheck = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userCheck.rows.length > 0) {
        memberIds.push(userCheck.rows[0].id);
        console.log(`   ✅ User ${email} exists (ID: ${userCheck.rows[0].id})`);
      } else {
        const userResult = await client.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
          [email.split('@')[0], email, 'fakehash', 'MEMBER']
        );
        memberIds.push(userResult.rows[0].id);
        console.log(`   ✅ User ${email} created (ID: ${userResult.rows[0].id})`);
      }
    }
    console.log('');

    // 4. Add members to team
    console.log('4️⃣  Adding members to team...');
    for (const memberId of memberIds) {
      await client.query(
        'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [teamId, memberId]
      );
    }
    console.log(`   ✅ ${memberIds.length} members added to team\n`);

    // 5. Insert sample tasks with various statuses
    console.log('5️⃣  Creating sample tasks...');
    
    const taskData = [
      { title: 'Complete project documentation', description: 'Write comprehensive documentation', status: 'COMPLETED', assignedTo: memberIds[0] },
      { title: 'Fix login bug', description: 'Users cannot log in with special characters', status: 'COMPLETED', assignedTo: memberIds[1] },
      { title: 'Update dashboard UI', description: 'Modernize the dashboard design', status: 'IN_PROGRESS', assignedTo: memberIds[0] },
      { title: 'Optimize database queries', description: 'Improve query performance', status: 'IN_PROGRESS', assignedTo: memberIds[2] },
      { title: 'Add user authentication', description: 'Implement JWT authentication', status: 'COMPLETED', assignedTo: memberIds[1] },
      { title: 'Create API documentation', description: 'Document all API endpoints', status: 'ASSIGNED', assignedTo: memberIds[2] },
      { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions', status: 'ASSIGNED', assignedTo: memberIds[0] },
      { title: 'Test mobile responsiveness', description: 'Ensure mobile compatibility', status: 'IN_PROGRESS', assignedTo: memberIds[1] },
      { title: 'Implement caching strategy', description: 'Add Redis caching', status: 'ASSIGNED', assignedTo: memberIds[2] },
      { title: 'Code review pull requests', description: 'Review and approve PRs', status: 'COMPLETED', assignedTo: memberIds[0] },
    ];

    let insertedCount = 0;
    for (const task of taskData) {
      const existingTask = await client.query(
        'SELECT * FROM tasks WHERE title = $1 LIMIT 1',
        [task.title]
      );

      if (existingTask.rows.length === 0) {
        const insertResult = await client.query(
          `INSERT INTO tasks (title, description, status, assigned_to_user_id, assigned_by_user_id, team_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [task.title, task.description, task.status, task.assignedTo, adminId, teamId]
        );

        // For completed tasks, set timestamps
        if (task.status === 'COMPLETED') {
          const startedAt = new Date(Date.now() - Math.random() * 86400000 * 7); // Random time up to 7 days ago
          const completedAt = new Date(startedAt.getTime() + Math.random() * 86400000); // Random time after start

          await client.query(
            'UPDATE tasks SET started_at = $1, completed_at = $2 WHERE id = $3',
            [startedAt, completedAt, insertResult.rows[0].id]
          );
        }

        // For in-progress tasks, set started_at
        if (task.status === 'IN_PROGRESS') {
          const startedAt = new Date(Date.now() - Math.random() * 86400000 * 3); // Random time up to 3 days ago
          await client.query(
            'UPDATE tasks SET started_at = $1 WHERE id = $2',
            [startedAt, insertResult.rows[0].id]
          );
        }

        insertedCount++;
        console.log(`   ✅ Task created: "${task.title}" (Status: ${task.status})`);
      } else {
        console.log(`   ℹ️  Task already exists: "${task.title}"`);
      }
    }
    console.log(`\n   📊 Total new tasks inserted: ${insertedCount}\n`);

    // 6. Verify data
    console.log('6️⃣  Verifying data...\n');

    // Total tasks
    const totalResult = await client.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`   📊 Total Tasks: ${totalResult.rows[0].count}`);

    // Task breakdown
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count FROM tasks GROUP BY status ORDER BY status
    `);
    for (const row of statusResult.rows) {
      console.log(`      - ${row.status}: ${row.count}`);
    }

    // Assigned users
    const assignedResult = await client.query(
      'SELECT COUNT(DISTINCT assigned_to_user_id) as count FROM tasks'
    );
    console.log(`   👥 Unique assigned users: ${assignedResult.rows[0].count}`);

    // Completion rate
    const rateResult = await client.query(`
      SELECT 
        ROUND(
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / 
          NULLIF(COUNT(*)::numeric, 0) * 100, 
          1
        ) as completion_rate
      FROM tasks
    `);
    console.log(`   📈 Completion rate: ${rateResult.rows[0].completion_rate || 0}%`);

    console.log('\n✅ Sample data insertion completed!\n');
    console.log('📌 Next steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Login as admin: admin@example.com / StrongPassword123!');
    console.log('   3. Check admin dashboard - it should now show task metrics\n');

  } catch (error) {
    console.error('❌ Error during data insertion:', error.message);
    console.error('\nFull error:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

insertSampleData();
