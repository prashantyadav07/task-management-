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
    Logger.info('Creating users table (if not exists)...');
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
    Logger.info('Creating teams table (if not exists)...');
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
    Logger.info('Creating team_members table (if not exists)...');
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

    // FIX #2: Tasks table
    Logger.info('Creating tasks table (if not exists)...');
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
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_user_id ON tasks(assigned_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);

    // FIX #2: Invites table
    Logger.info('Creating invites table (if not exists)...');
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

    await client.query('COMMIT');
    Logger.info('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    Logger.error('❌ Failed to initialize database schema', error);
    throw error;
  } finally {
    client.release();
  }
};

export default initializeDatabase;
