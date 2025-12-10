import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import type { ApiError } from '../types/common';

// Get API base URL from environment variables with fallback
const getApiBaseUrl = (): string => {
  // Check for Vite environment variables
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback for development
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // Production fallback - should be set via environment variables
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle CORS and network errors
    if (!error.response) {
      // Network error or CORS issue
      const networkError: ApiError = {
        code: 0,
        message: error.code === 'ERR_NETWORK' 
          ? 'Cannot connect to backend server. Please ensure the backend is running at http://localhost:8000'
          : 'Network error occurred. Please check your connection.',
        details: { originalError: error.message },
      };
      return Promise.reject(networkError);
    }
    
    // Transform error to our ApiError format
    const apiError: ApiError = {
      code: error.response?.status || 500,
      message: (error.response?.data as any)?.message || error.message || 'An unexpected error occurred',
      details: error.response?.data,
    };
    
    return Promise.reject(apiError);
  }
);

export default api;