import React, { useState, useCallback } from 'react';
import type { ApiError } from '../types/common';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = apiError.message || 'An unexpected error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

// Specialized hook for immediate execution
export function useApiImmediate<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const apiHook = useApi(apiFunction);

  // Execute immediately when dependencies change
  React.useEffect(() => {
    apiHook.execute();
  }, dependencies);

  return apiHook;
}