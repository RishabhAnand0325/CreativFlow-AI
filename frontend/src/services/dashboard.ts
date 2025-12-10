import api from '../config/api';
import type { User, Project, Asset, UploadResponse, GenerationRequest, GenerationJob, ProvidersResponse } from '../types';

const BASE_URL = '/api/v1/projects';

export const dashboard = {
  getUserProfile: async (): Promise<User> => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },

  getProjects: async (limit: number = 10, offset: number = 0): Promise<Project[]> => {
    try {
      const response = await api.get(`${BASE_URL}?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get projects:', error);
      // Return empty array as fallback
      return [];
    }
  },

  getProjectStatus: async (projectId: string): Promise<{ status: string; progress?: number }> => {
    const response = await api.get(`${BASE_URL}/${projectId}/status`);
    return response.data;
  },

  getProjectPreview: async (projectId: string): Promise<Asset[]> => {
    const response = await api.get(`${BASE_URL}/${projectId}/preview`);
    return response.data;
  },

  getProjectAssets: async (projectId: string): Promise<Asset[]> => {
    const response = await api.get(`${BASE_URL}/${projectId}/assets`);
    return response.data;
  },

  updatePreferences: async (preferences: Record<string, any>): Promise<User> => {
    const response = await api.put('/api/v1/users/me/preferences', preferences);
    return response.data;
  },

  uploadProject: async (projectName: string, files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('projectName', projectName);
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${projectId}`);
  },

  getAIProviders: async (): Promise<ProvidersResponse> => {
    const response = await api.get('/api/v1/providers');
    return response.data;
  },

  startGeneration: async (generationRequest: GenerationRequest): Promise<GenerationJob> => {
    const response = await api.post('/api/v1/generate', generationRequest);
    return response.data;
  },
};