import axios from 'axios';

// API Base URL - automatically detects environment
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://task-management-ten-neon.vercel.app/api';

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    };

    console.error('❌ API Error:', errorDetails);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  verifyInvite: (token) => api.post('/auth/verify-invite', { token }),
  signupViaInvite: (token, name, password) =>
    api.post('/auth/signup-via-invite', { token, name, password }),
};

// Teams API
export const teamsAPI = {
  getTeams: () => api.get('/teams'),
  createTeam: (name, description) => api.post('/teams', { name, description }),
  getTeamMembers: (teamId) => api.get(`/teams/${teamId}/members`),
  addMemberToTeam: (teamId, userId) => api.post(`/teams/${teamId}/members`, { userId }),
  deleteTeam: (teamId) => api.delete(`/teams/${teamId}`),
};

// Tasks API
export const tasksAPI = {
  getMyTasks: () => api.get('/tasks/my-tasks'),
  getTeamTasks: (teamId) => api.get(`/tasks/team/${teamId}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  startTask: (taskId) => api.put(`/tasks/${taskId}/start`, {}),
  completeTask: (taskId, data) => api.put(`/tasks/${taskId}/complete`, data || {}),
  deleteTask: (taskId, hard = false) => api.delete(`/tasks/${taskId}?hard=${hard}`),
};

// Invites API
export const invitesAPI = {
  sendInvitation: (email, teamId) => api.post('/invites', { email, teamId }),
  sendBulkInvitation: (teamId, emails) => api.post('/invites/bulk', { teamId, emails }),
  getBulkBatch: (batchId) => api.get(`/invites/bulk/${batchId}`),
};

// Users API (Admin Only)
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUserCount: () => api.get('/users/stats/count'),
  getUserDetails: (userId) => api.get(`/users/${userId}`),
  assignTask: (userId, taskId) => api.post(`/users/${userId}/assign-task`, { taskId }),
  assignTaskBulk: (taskId, userIds) => api.post('/users/assign-task-bulk', { taskId, userIds }),
  deleteUser: (userId) => api.delete(`/users/${userId}?hard=true`),
};

// Analytics API (Admin Only)
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getAllTasks: () => api.get('/analytics/all-tasks'),
  getCompletedTasks: () => api.get('/analytics/completed-tasks'),
  getRecentTasks: (limit = 10) => api.get(`/analytics/recent-tasks?limit=${limit}`),
  getTeamStats: (teamId) => api.get(`/analytics/team/${teamId}`),
  getUserStats: (userId) => api.get(`/analytics/user/${userId}`),
  getCompletionTime: () => api.get('/analytics/completion-time'),
  getCompletionRate: () => api.get('/analytics/completion-rate'),
};

// Chat API
export const chatAPI = {
  getTeamMessages: (teamId, limit = 100, offset = 0) =>
    api.get(`/chat/${teamId}?limit=${limit}&offset=${offset}`),
  createMessage: (teamId, message) => api.post(`/chat/${teamId}`, { message }),
  deleteMessage: (messageId, hard = false) => api.delete(`/chat/message/${messageId}?hard=${hard}`),
};

export default api;