import axios from 'axios';

/**
 * SkillBridge Axios API Client Instance
 * Configured with baseURL from environment variable VITE_API_URL.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized data extraction and error normalization
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // If receiving 401 from protected routes (excluding login and register endpoints)
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      localStorage.removeItem('skillbridge_token');
    }

    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
