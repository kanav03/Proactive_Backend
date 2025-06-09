import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  promoteUser: (userId) => api.put(`/auth/promote/${userId}`),
};

// User services (admin only)
export const userService = {
  getAllUsers: () => api.get('/users'),
};

// Form services
export const formService = {
  getForms: () => api.get('/forms'),
  getAllForms: () => api.get('/forms/all'),
  createForm: (formData) => api.post('/forms', formData),
  getFormById: (id) => api.get(`/forms/${id}`),
  updateForm: (id, formData) => api.put(`/forms/${id}`, formData),
  deleteForm: (id) => api.delete(`/forms/${id}`),
  getFormByShareLink: (shareLink) => api.get(`/forms/share/${shareLink}`),
};

// Response services
export const responseService = {
  joinForm: (formId) => api.post(`/responses/${formId}/join`),
  getResponseById: (id) => api.get(`/responses/${id}`),
  updateFieldValue: (responseId, fieldId, value) => 
    api.put(`/responses/${responseId}/field/${fieldId}`, { value }),
  getFormResponses: (formId) => api.get(`/responses/form/${formId}`),
  markResponseComplete: (id) => api.put(`/responses/${id}/complete`),
};

export default api;
