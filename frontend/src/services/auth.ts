import api from '../config/api';
import type { LoginRequest, LoginResponse, User } from '../types';

const BASE_URL = '/api/v1/auth';

export const auth = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const loginData: LoginRequest = { username, password };
    const response = await api.post(`${BASE_URL}/login`, loginData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post(`${BASE_URL}/logout`);
      } catch (error) {
        // Even if logout fails on server, clear local token
        console.warn('Logout request failed:', error);
      }
    }
    localStorage.removeItem('token');
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post(`${BASE_URL}/refresh`);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },

  updatePreferences: async (preferences: Record<string, any>): Promise<User> => {
    const response = await api.put('/api/v1/users/me/preferences', preferences);
    return response.data;
  },
};
