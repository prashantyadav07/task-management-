import pool from '../config/db.js';
import QUERIES from '../constants/queries.js';
import { Logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

const TeamModel = {
  /**
   * Create a new team and add owner as member
   * @throws {DatabaseError}
   */
  create: async (name, ownerId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create the team
      const result = await client.query(QUERIES.TEAM.CREATE, [name, ownerId]);
      const team = result.rows[0];

      // Add the owner as the first member of the team
      await client.query(QUERIES.TEAM.ADD_MEMBER, [team.id, ownerId]);

      await client.query('COMMIT');

      Logger.debug('Team created successfully', { teamId: team.id, ownerId, teamName: name });
      return team;
    } catch (error) {
      await client.query('ROLLBACK');
      Logger.error('Failed to create team', error, { ownerId, teamName: name });
      throw new DatabaseError('Failed to create team', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find a team by ID
   * @throws {DatabaseError}
   */
  findById: async (id) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TEAM.FIND_BY_ID, [id]);
      return result.rows[0];
    } catch (error) {
      Logger.error('Failed to find team by ID', error, { teamId: id });
      throw new DatabaseError('Database query failed', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find all teams for a specific user
   * @throws {DatabaseError}
   */
  findAllTeamsForUser: async (userId) => {
    const client = await pool.connect();
    try {
      Logger.debug('Executing FIND_ALL_TEAMS_FOR_USER query', { userId });
      
      const result = await client.query(QUERIES.TEAM.FIND_ALL_TEAMS_FOR_USER, [userId]);
      
      Logger.debug('Query executed successfully', { 
        userId, 
        teamsFound: result.rows.length,
        teams: result.rows 
      });
      
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch teams for user', error, { userId });
      throw new DatabaseError('Failed to fetch user teams', error);
    } finally {
      client.release();
    }
  },

  /**
   * Find members of a specific team
   * @throws {DatabaseError}
   */
  findMembers: async (teamId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(QUERIES.TEAM.FIND_MEMBERS, [teamId]);
      return result.rows;
    } catch (error) {
      Logger.error('Failed to fetch team members', error, { teamId });
      throw new DatabaseError('Failed to fetch team members', error);
    } finally {
      client.release();
    }
  },

  /**
   * Add a member to a team
   * @throws {DatabaseError}
   */
  addMember: async (teamId, userId) => {
    const client = await pool.connect();
    try {
      await client.query(QUERIES.TEAM.ADD_MEMBER, [teamId, userId]);
      Logger.debug('Team member added', { teamId, userId });
    } catch (error) {
      Logger.error('Failed to add team member', error, { teamId, userId });
      throw new DatabaseError('Failed to add team member', error);
    } finally {
      client.release();
    }
  },

  /**
   * Remove a member from a team
   * @throws {DatabaseError}
   */
  removeMember: async (teamId, userId) => {
    const client = await pool.connect();
    try {
      await client.query(QUERIES.TEAM.REMOVE_MEMBER, [teamId, userId]);
      Logger.debug('Team member removed', { teamId, userId });
    } catch (error) {
      Logger.error('Failed to remove team member', error, { teamId, userId });
      throw new DatabaseError('Failed to remove team member', error);
    } finally {
      client.release();
    }
  },

  /**
   * Check if user is member of a team
   * @throws {DatabaseError}
   */
  isMember: async (teamId, userId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      Logger.error('Failed to check team membership', error, { teamId, userId });
      throw new DatabaseError('Failed to check team membership', error);
    } finally {
      client.release();
    }
  },
};

export default TeamModel;