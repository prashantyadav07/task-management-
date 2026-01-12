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
  },
  ANALYTICS: {
    // Total tasks across all teams
    GET_TOTAL_TASKS: 'SELECT COUNT(*) as total_tasks FROM tasks',
    
    // Total assigned users (distinct users assigned at least one task)
    GET_ASSIGNED_USERS_COUNT: 'SELECT COUNT(DISTINCT assigned_to_user_id) as assigned_users FROM tasks',
    
    // Total in-progress tasks
    GET_IN_PROGRESS_TASKS: 'SELECT COUNT(*) as in_progress_tasks FROM tasks WHERE status = $1',
    
    // Total completed tasks
    GET_COMPLETED_TASKS: 'SELECT COUNT(*) as completed_tasks FROM tasks WHERE status = $1',
    
    // Tasks with completion timestamps
    GET_COMPLETED_TASKS_WITH_TIMESTAMPS: `
      SELECT 
        id,
        title,
        assigned_to_user_id,
        assigned_by_user_id,
        team_id,
        started_at,
        completed_at,
        EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duration_minutes,
        created_at
      FROM tasks
      WHERE status = $1
      ORDER BY completed_at DESC
    `,
    
    // Recent tasks (last N tasks)
    GET_RECENT_TASKS: `
      SELECT 
        id,
        title,
        description,
        status,
        assigned_to_user_id,
        assigned_by_user_id,
        team_id,
        assigned_at,
        started_at,
        completed_at,
        due_date
      FROM tasks
      ORDER BY assigned_at DESC
      LIMIT $1
    `,
    
    // Task statistics for a specific team
    GET_TEAM_TASK_STATS: `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_count,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count
      FROM tasks
      WHERE team_id = $1
    `,
    
    // User-specific task analytics
    GET_USER_TASK_STATS: `
      SELECT 
        COUNT(*) as total_assigned,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_count,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count
      FROM tasks
      WHERE assigned_to_user_id = $1
    `,
    
    // Average task completion time
    GET_AVERAGE_COMPLETION_TIME: `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration_minutes
      FROM tasks
      WHERE status = $1 AND completed_at IS NOT NULL
    `,
    
    // Task completion rate
    GET_COMPLETION_RATE: `
      SELECT 
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
        COUNT(*) as total_tasks,
        ROUND(
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / 
          NULLIF(COUNT(*)::numeric, 0) * 100, 
          2
        ) as completion_rate_percentage
      FROM tasks
    `
  }
};

export default QUERIES;