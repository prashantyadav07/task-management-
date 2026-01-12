/**
 * Database Diagnostic Tool
 * Checks if database tables exist and inspects their contents
 * Run: node diagnostic-check.js
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

const run = async () => {
  const client = await pool.connect();
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         DATABASE DIAGNOSTIC CHECK                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Check if tables exist
    console.log('📊 CHECKING TABLE EXISTENCE...\n');

    const tables = ['users', 'teams', 'team_members', 'tasks', 'invites'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table} table - ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    console.log('\n📈 DATA COUNTS...\n');

    // Count users
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = usersResult.rows[0].count;
    console.log(`  👥 Users: ${userCount}`);

    // Count teams
    const teamsResult = await client.query('SELECT COUNT(*) as count FROM teams');
    const teamCount = teamsResult.rows[0].count;
    console.log(`  🏢 Teams: ${teamCount}`);

    // Count team members
    const membersResult = await client.query('SELECT COUNT(*) as count FROM team_members');
    const memberCount = membersResult.rows[0].count;
    console.log(`  👤 Team Members: ${memberCount}`);

    // Count tasks
    const tasksResult = await client.query('SELECT COUNT(*) as count FROM tasks');
    const taskCount = tasksResult.rows[0].count;
    console.log(`  ✅ Tasks: ${taskCount}`);

    // Count invites
    const invitesResult = await client.query('SELECT COUNT(*) as count FROM invites');
    const inviteCount = invitesResult.rows[0].count;
    console.log(`  📧 Invites: ${inviteCount}`);

    console.log('\n📋 TASK BREAKDOWN BY STATUS...\n');

    // Get task breakdown by status
    const statusResult = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks
      GROUP BY status
      ORDER BY status
    `);

    if (statusResult.rows.length === 0) {
      console.log('  ⚠️  No tasks found in database');
    } else {
      for (const row of statusResult.rows) {
        console.log(`  ${row.status}: ${row.count} tasks`);
      }
    }

    console.log('\n🔍 TASK ASSIGNMENTS...\n');

    // Get task assignments
    const assignResult = await client.query(`
      SELECT 
        COUNT(DISTINCT assigned_to_user_id) as assigned_to_count,
        COUNT(DISTINCT assigned_by_user_id) as assigned_by_count,
        COUNT(DISTINCT team_id) as team_count
      FROM tasks
    `);

    const assignRow = assignResult.rows[0];
    console.log(`  Users with assigned tasks: ${assignRow.assigned_to_count}`);
    console.log(`  Users who assigned tasks: ${assignRow.assigned_by_count}`);
    console.log(`  Teams with tasks: ${assignRow.team_count}`);

    console.log('\n📊 ANALYTICS QUERIES TEST...\n');

    // Test total tasks query
    const totalTasksResult = await client.query('SELECT COUNT(*) as total_tasks FROM tasks');
    console.log(`  GET_TOTAL_TASKS: ${totalTasksResult.rows[0].total_tasks}`);

    // Test assigned users query
    const assignedUsersResult = await client.query(
      'SELECT COUNT(DISTINCT assigned_to_user_id) as assigned_users FROM tasks'
    );
    console.log(`  GET_ASSIGNED_USERS_COUNT: ${assignedUsersResult.rows[0].assigned_users}`);

    // Test in-progress tasks query
    const inProgressResult = await client.query(
      'SELECT COUNT(*) as in_progress_tasks FROM tasks WHERE status = $1',
      ['IN_PROGRESS']
    );
    console.log(`  GET_IN_PROGRESS_TASKS: ${inProgressResult.rows[0].in_progress_tasks}`);

    // Test completed tasks query
    const completedResult = await client.query(
      'SELECT COUNT(*) as completed_tasks FROM tasks WHERE status = $1',
      ['COMPLETED']
    );
    console.log(`  GET_COMPLETED_TASKS: ${completedResult.rows[0].completed_tasks}`);

    // Test completion rate query
    const rateResult = await client.query(`
      SELECT 
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
        COUNT(*) as total_tasks,
        ROUND(
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / 
          NULLIF(COUNT(*)::numeric, 0) * 100, 
          2
        ) as completion_rate_percentage
      FROM tasks
    `);

    const rateRow = rateResult.rows[0];
    console.log(`  GET_COMPLETION_RATE: ${rateRow.completion_rate_percentage || 0}%`);

    console.log('\n📋 SAMPLE TASKS (First 5)...\n');

    // Get sample tasks
    const sampleResult = await client.query(`
      SELECT 
        id, 
        title, 
        status, 
        assigned_to_user_id, 
        assigned_by_user_id,
        team_id,
        created_at
      FROM tasks
      LIMIT 5
    `);

    if (sampleResult.rows.length === 0) {
      console.log('  ⚠️  No tasks in database');
    } else {
      for (const task of sampleResult.rows) {
        console.log(`  ID: ${task.id}`);
        console.log(`  Title: ${task.title}`);
        console.log(`  Status: ${task.status}`);
        console.log(`  Assigned To: ${task.assigned_to_user_id} | By: ${task.assigned_by_user_id}`);
        console.log(`  Team: ${task.team_id}`);
        console.log('  ---');
      }
    }

    console.log('\n📊 TASKS TABLE SCHEMA...\n');

    // Get table structure
    const schemaResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);

    for (const col of schemaResult.rows) {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    }

    console.log('\n✅ Diagnostic check completed!\n');

  } catch (error) {
    console.error('❌ Error during diagnostic check:', error.message);
    console.error('\nFull error:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

run();
