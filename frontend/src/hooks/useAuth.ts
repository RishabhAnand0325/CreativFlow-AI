import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { auth } from '../services/auth';
import { useApi } from './useApi';

export const useAuth = () => {
  const { state, setUser, setLoading, resetState } = useAppContext();
  const navigate = useNavigate();

  const loginApi = useApi(auth.login);
  const logoutApi = useApi(auth.logout);
  const getCurrentUserApi = useApi(auth.getCurrentUser);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        setLoading('auth', { isLoading: true, error: null });
        const response = await loginApi.execute(username, password);
        
        // Store token
        localStorage.setItem('token', response.accessToken);
        
        // Get user profile
        const user = await getCurrentUserApi.execute();
        setUser(user);
        
        setLoading('auth', { isLoading: false, error: null });
        navigate('/user-dashboard');
        
        return response;
      } catch (error) {
        setLoading('auth', { isLoading: false, error: loginApi.error });
        throw error;
      }
    },
    [loginApi, getCurrentUserApi, setUser, setLoading, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi.execute();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('token');
      resetState();
      navigate('/login');
    }
  }, [logoutApi, resetState, navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }

    try {
      const user = await getCurrentUserApi.execute();
      setUser(user);
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
      return false;
    }
  }, [getCurrentUserApi, setUser, navigate]);

  return {
    user: state.user,
    isAuthenticated: !!state.user,
    loading: state.loading.auth,
    login,
    logout,
    checkAuth,
  };
};