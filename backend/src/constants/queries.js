const QUERIES = {
  USER: {
    CREATE: 'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    FIND_BY_EMAIL: 'SELECT * FROM users WHERE email = $1',
    FIND_BY_ID: 'SELECT id, name, email, role FROM users WHERE id = $1',
    FIND_ALL: 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
    COUNT_ALL: 'SELECT COUNT(*) as total_users FROM users',
  },
  TEAM: {
    CREATE: 'INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id',
    FIND_BY_ID: 'SELECT * FROM teams WHERE id = $1',
    FIND_MEMBERS: 'SELECT u.id, u.name, u.email FROM users u JOIN team_members tm ON u.id = tm.user_id WHERE tm.team_id = $1',
    ADD_MEMBER: 'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT (team_id, user_id) DO NOTHING',
    REMOVE_MEMBER: 'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
    FIND_ALL_TEAMS_FOR_USER: `
      SELECT DISTINCT t.id, t.name, t.owner_id
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.owner_id = $1 OR tm.user_id = $1
      ORDER BY t.id DESC
    `
  },
  TASK: {
    CREATE: 'INSERT INTO tasks (title, description, assigned_to_user_id, assigned_by_user_id, team_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, description, assigned_to_user_id, assigned_by_user_id, team_id, status, assigned_at',
    FIND_BY_ID: 'SELECT * FROM tasks WHERE id = $1',
    FIND_BY_ASSIGNED_USER: 'SELECT * FROM tasks WHERE assigned_to_user_id = $1 ORDER BY assigned_at DESC',
    FIND_BY_TEAM: 'SELECT * FROM tasks WHERE team_id = $1 ORDER BY assigned_at DESC',
    UPDATE_STATUS_TO_IN_PROGRESS: 'UPDATE tasks SET status = $1, started_at = NOW() WHERE id = $2 AND assigned_to_user_id = $3 AND status = $4 RETURNING *',
    UPDATE_STATUS_TO_COMPLETED: 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE id = $2 AND assigned_to_user_id = $3 AND status = $4 RETURNING *',
    GET_TASK_TIME: 'SELECT EXTRACT(EPOCH FROM (completed_at - started_at))/60 AS time_in_minutes FROM tasks WHERE id = $1 AND status = $2'
  },
  INVITE: {
    CREATE: 'INSERT INTO invites (email, team_id, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, email, team_id, token, expires_at, status',
    FIND_BY_TOKEN: 'SELECT * FROM invites WHERE token = $1',
    UPDATE_STATUS_USED: 'UPDATE invites SET status = $1, accepted_at = NOW() WHERE id = $2 RETURNING *',
    DELETE_EXPIRED: 'DELETE FROM invites WHERE expires_at < NOW()'
  }
};

export default QUERIES;