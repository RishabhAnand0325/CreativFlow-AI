import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useApi } from './useApi';
import { dashboard } from '../services/dashboard';
import type { User, Project } from '../types';

export const useDashboard = () => {
  const { setProjects, setUser } = useAppContext();

  // Typed API hooks
  const userProfileApi = useApi<User>(dashboard.getUserProfile);
  const projectsApi = useApi<Project[]>(dashboard.getProjects);
  const uploadApi = useApi<any>(dashboard.uploadProject);

  const loadDashboardData = useCallback(async () => {
    const [userProfile, projectsData] = await Promise.all([
      userProfileApi.execute(),
      projectsApi.execute()
    ]);

    // Update context state
    setUser(userProfile);
    setProjects(projectsData);

    return { userProfile, projectsData };
  }, [userProfileApi, projectsApi, setUser, setProjects]);

  const uploadProject = useCallback(async (projectName: string, files: File[]) => {
    const result = await uploadApi.execute(projectName, files);
    // Reload dashboard data after upload
    await loadDashboardData();
    return result;
  }, [uploadApi, loadDashboardData]);

  return {
    // Data
    userProfile: userProfileApi.data,
    projects: projectsApi.data,
    
    // Loading states
    loading: {
      userProfile: userProfileApi.loading,
      projects: projectsApi.loading,
      upload: uploadApi.loading,
    },
    
    // Errors
    errors: {
      userProfile: userProfileApi.error,
      projects: projectsApi.error,
      upload: uploadApi.error,
    },
    
    // Actions
    loadDashboardData,
    uploadProject,
    
    // Reset functions
    resetUserProfile: userProfileApi.reset,
    resetProjects: projectsApi.reset,
    resetUpload: uploadApi.reset,
  };
};