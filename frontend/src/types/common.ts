// Common types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  code: number;
  message: string;
  details?: any;
}