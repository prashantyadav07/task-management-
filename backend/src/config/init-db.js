/**
 * Database Schema Initialization
 * 
 * This script initializes the database schema with all required tables
 * and constraints. Run this once when setting up the application.
 * 
 * CRITICAL FIX #1 & #2: Fixes duplicate email issue and ensures all tables exist
 */

import pool from '../config/db.js';
import { Logger } from '../utils/logger.js';

/**
 * Initialize database schema
 * Creates all required tables with proper constraints
 */
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // FIX #1: Users table with UNIQUE constraint on email
    // This prevents duplicate email registration at the database level
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // FIX #2: Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
    `);

    // FIX #2: Team members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_team_member UNIQUE(team_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
    `);

    // FIX #2: Tasks table with deadline tracking and audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
        assigned_to_user_id INTEGER NOT NULL,
        assigned_by_user_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        completed_by_user_id INTEGER,
        due_date TIMESTAMP,
        late_submission_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_completed_by FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_tasks_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_user_id ON tasks(assigned_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
    `);

    // FIX #2: Invites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invites (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        team_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_invites_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
      CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
      CREATE INDEX IF NOT EXISTS idx_invites_team_id ON invites(team_id);
    `);

    // Real-time Team Chat Messages table
    // Messages are ordered by created_at ASC for chronological display (old to new)
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_chat_messages (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_chat_messages_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON team_chat_messages(team_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON team_chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON team_chat_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_is_deleted ON team_chat_messages(is_deleted);
    `);

    // Bulk Invites table for tracking multiple invitation batches
    // Supports inviting multiple users at once while maintaining referential integrity
    await client.query(`
      CREATE TABLE IF NOT EXISTS bulk_invites (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(255) NOT NULL UNIQUE,
        team_id INTEGER NOT NULL,
        created_by_user_id INTEGER NOT NULL,
        total_invites INTEGER NOT NULL DEFAULT 0,
        accepted_count INTEGER NOT NULL DEFAULT 0,
        pending_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bulk_invites_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        CONSTRAINT fk_bulk_invites_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_bulk_invites_batch_id ON bulk_invites(batch_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_invites_team_id ON bulk_invites(team_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_invites_creator_id ON bulk_invites(created_by_user_id);
    `);

    // Bulk Invite Items table for tracking individual emails in a bulk invitation
    await client.query(`
      CREATE TABLE IF NOT EXISTS bulk_invite_items (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bulk_items_batch FOREIGN KEY (batch_id) REFERENCES bulk_invites(batch_id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_bulk_items_batch_id ON bulk_invite_items(batch_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_items_email ON bulk_invite_items(email);
      CREATE INDEX IF NOT EXISTS idx_bulk_items_token ON bulk_invite_items(token);
      CREATE INDEX IF NOT EXISTS idx_bulk_items_status ON bulk_invite_items(status);
    `);

    // Team Ownership Tracking table (for audit and delete permission tracking)
    // Allows tracking which admin/member created which team for proper authorization
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_ownership (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        creator_user_id INTEGER NOT NULL,
        creator_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_team_ownership_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        CONSTRAINT fk_team_ownership_creator FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_team_ownership UNIQUE(team_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_team_ownership_team_id ON team_ownership(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_ownership_creator_id ON team_ownership(creator_user_id);
    `);

    // Task Ownership Tracking table (for delete permission tracking)
    // Stores which admin created/assigned the task for proper authorization
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_ownership (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        creator_user_id INTEGER NOT NULL,
        creator_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_ownership_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_ownership_creator FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_task_ownership UNIQUE(task_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_task_ownership_task_id ON task_ownership(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_ownership_creator_id ON task_ownership(creator_user_id);
    `);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    Logger.error('Database schema initialization failed', error);
    throw error;
  } finally {
    client.release();
  }
};

export default initializeDatabase;
