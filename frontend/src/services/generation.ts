import api from '../config/api';
import type {
  ProvidersResponse,
  FormatsResponse,
  GenerationRequest,
  GenerationJob,
  JobResults,
  GeneratedAsset,
  DownloadRequest,
  DownloadResponse,
} from '../types';

const BASE_URL = '/api/v1';

export const generation = {
  getProviders: async (): Promise<ProvidersResponse> => {
    try {
      const response = await api.get(`${BASE_URL}/providers`);
      return response.data;
    } catch (error) {
      console.error('Failed to get providers:', error);
      // Return fallback data
      return { providers: ['gemini'], default_provider: 'gemini' };
    }
  },

  getFormats: async (): Promise<FormatsResponse> => {
    try {
      const response = await api.get(`${BASE_URL}/formats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get formats:', error);
      // Return fallback data with common formats
      return {
        resizing: [
          {
            id: 'instagram-post',
            name: 'Instagram Post',
            platformId: 'instagram',
            platformName: 'Instagram',
            width: 1080,
            height: 1080,
            description: 'Square format for Instagram posts'
          },
          {
            id: 'instagram-story',
            name: 'Instagram Story',
            platformId: 'instagram',
            platformName: 'Instagram',
            width: 1080,
            height: 1920,
            description: 'Vertical format for Instagram stories'
          },
          {
            id: 'facebook-post',
            name: 'Facebook Post',
            platformId: 'facebook',
            platformName: 'Facebook',
            width: 1200,
            height: 630,
            description: 'Landscape format for Facebook posts'
          }
        ],
        repurposing: []
      };
    }
  },

  startGeneration: async (generationRequest: GenerationRequest): Promise<GenerationJob> => {
    const response = await api.post(`${BASE_URL}/generate`, generationRequest);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<{ status: string; progress: number }> => {
    const response = await api.get(`${BASE_URL}/generate/${jobId}/status`);
    return response.data;
  },

  getJobResults: async (jobId: string): Promise<JobResults> => {
    const response = await api.get(`${BASE_URL}/generate/${jobId}/results`);
    return response.data;
  },

  getGeneratedAsset: async (assetId: string): Promise<GeneratedAsset> => {
    const response = await api.get(`${BASE_URL}/generated-assets/${assetId}`);
    return response.data;
  },

  getDownloadUrl: async (downloadRequest: DownloadRequest): Promise<DownloadResponse> => {
    const response = await api.post(`${BASE_URL}/download`, downloadRequest);
    return response.data;
  },

  applyManualEdits: async (assetId: string, edits: any): Promise<GeneratedAsset> => {
    const response = await api.put(`${BASE_URL}/generated-assets/${assetId}`, {
      edits: edits,
    });
    return response.data;
  },

  downloadAssets: async (downloadData: {
    assetIds: string[];
    format: string;
    quality: string;
    grouping: string;
  }): Promise<{ downloadUrl: string }> => {
    // Use the correct download endpoint with proper payload structure
    const payload = {
      assetIds: downloadData.assetIds,
      format: downloadData.format,
      quality: downloadData.quality,
      grouping: downloadData.grouping
    };
    const response = await api.post(`${BASE_URL}/download`, payload);
    return response.data;
  },

  downloadSingleAsset: async (assetId: string): Promise<void> => {
    // Direct download using the asset download endpoint
    const response = await api.get(`${BASE_URL}/assets/${assetId}/download`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `asset_${assetId}.jpg`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};