import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  create: (data) => api.post('/projects/', data),
  list: () => api.get('/projects/'),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addModule: (id, module) => api.post(`/projects/${id}/modules`, module),
};

// Codebase API
export const codebaseAPI = {
  createFile: (data) => api.post('/codebase/files', data),
  listFiles: (projectId, snapshotId) => 
    api.get(`/codebase/projects/${projectId}/files`, { params: { snapshot_id: snapshotId } }),
  getFileContent: (fileId) => api.get(`/codebase/files/${fileId}/content`),
  listSnapshots: (projectId) => api.get(`/codebase/projects/${projectId}/snapshots`),
  getDiff: (projectId, data) => api.post(`/codebase/projects/${projectId}/diff`, data),
};

// Codegen API
export const codegenAPI = {
  generate: (data) => api.post('/codegen/generate', data),
};

// Agent API
export const agentAPI = {
  start: (data) => api.post('/agent/start', data),
  startTask: (data) => agentAPI.start(data),
  getTask: (taskId) => api.get(`/agent/tasks/${taskId}`),
  listTasks: (projectId) => api.get(`/agent/projects/${projectId}/tasks`),
};

// UI Layout API
export const uiLayoutAPI = {
  listScreens: (projectId) => api.get(`/ui-layout/projects/${projectId}/screens`),
  createScreen: (projectId, data) => api.post(`/ui-layout/projects/${projectId}/screens`, data),
  updateElement: (data) => api.post('/ui-layout/update-element', data),
};

// RAG API
export const ragAPI = {
  index: (data) => api.post('/rag/index', data),
  search: (data) => api.post('/rag/search', data),
};

// Schema Sync API
export const schemaSyncAPI = {
  syncSchema: (data) => api.post('/schema-sync/sync', data),
  checkConsistency: (projectId, modelName) => 
    api.get(`/schema-sync/projects/${projectId}/models/${modelName}/consistency`),
  getHistory: (projectId) => api.get(`/schema-sync/projects/${projectId}/schema-history`),
};

// Autonomous Planner API
export const autonomousAPI = {
  createPlan: (projectId, goal) => api.post('/autonomous-planner/plan', goal, { params: { project_id: projectId } }),
  getPlans: (projectId) => api.get(`/autonomous-planner/plans/${projectId}`),
  getPlan: (planId) => api.get(`/autonomous-planner/plan/${planId}`),
  deletePlan: (planId) => api.delete(`/autonomous-planner/plan/${planId}`),
  executePlan: (planId) => api.post(`/agent/autonomous/execute/${planId}`),
};

// Continuous Verification API
export const verificationAPI = {
  verifyProject: (projectId) => api.post(`/verification/verify/${projectId}`),
  getReports: (projectId, limit = 10) => api.get(`/verification/reports/${projectId}`, { params: { limit } }),
  getHealthScore: (projectId) => api.get(`/verification/health/${projectId}`),
};

// Database Schema API
export const dbSchemaAPI = {
  getSchemas: (projectId) => api.get(`/db-schema/projects/${projectId}/schemas`),
  addSampleData: (projectId, data) => api.post(`/db-schema/projects/${projectId}/sample-data`, data),
  generateSeedScript: (projectId, data) => api.post(`/db-schema/projects/${projectId}/seed-script`, data),
  clearSampleData: (projectId, tableName) => api.delete(`/db-schema/projects/${projectId}/sample-data/${tableName}`),
};

// AI Code Orchestrator API
export const orchestratorAPI = {
  orchestrate: (data) => {
    const orchestratorUrl = process.env.REACT_APP_ORCHESTRATOR_URL || 'http://localhost:8002';
    return axios.post(`${orchestratorUrl}/orchestrate`, data);
  },
};

// WebSocket connection
export const createWebSocketConnection = (projectId) => {
  // Fallback to localhost if BACKEND_URL is not set to avoid "undefined" URLs
  const base = BACKEND_URL || 'http://localhost:8001';
  const wsUrl = base.replace('https://', 'wss://').replace('http://', 'ws://');
  return new WebSocket(`${wsUrl}/ws/projects/${projectId}`);
};

export default api;
