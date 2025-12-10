// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  code?: number;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  preferences?: UserPreferences;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  [key: string]: any;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
  fileCounts?: {
    psd?: number;
    jpg?: number;
    png?: number;
    total?: number;
  };
  submitDate?: string;
}

export type ProjectStatus = 'uploading' | 'processing' | 'ready_for_review' | 'completed' | 'failed';

// Asset Types
export interface Asset {
  id: string;
  project_id: string;
  original_filename: string;
  storage_path: string;
  file_type: string;
  file_size_bytes: number;
  dimensions?: {
    width: number;
    height: number;
  };
  dpi?: number;
  ai_metadata?: AssetMetadata;
  created_at: string;
  previewUrl?: string;
}

export interface AssetMetadata {
  hasProduct?: boolean;
  hasText?: boolean;
  hasTagline?: boolean;
  hasLogo?: boolean;
  layers?: string;
  detected_elements?: DetectedElement[];
  [key: string]: any;
}

export interface DetectedElement {
  type: string;
  confidence: number;
  bbox?: [number, number, number, number];
  description?: string;
}

// Format Types
export interface AssetFormat {
  id: string;
  name: string;
  platformId: string;
  platformName: string;
  width: number;
  height: number;
  description?: string;
  is_active?: boolean;
  // Legacy fields for backward compatibility
  platform_id?: string;
  platform_name?: string;
}

export interface FormatsResponse {
  resizing: AssetFormat[];
  repurposing: AssetFormat[];
}

// Generation Types
export interface GenerationRequest {
  projectId: string;
  formatIds?: string[];
  customResizes?: CustomResize[];
  provider: string;
}

export interface CustomResize {
  width: number;
  height: number;
  name?: string;
}

export interface GenerationSettings {
  priority?: 'low' | 'normal' | 'high';
  quality?: 'draft' | 'standard' | 'high';
  [key: string]: any;
}

export interface GenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  status: JobStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface GeneratedAsset {
  id: string;
  job_id: string;
  original_asset_id: string;
  asset_format_id?: string;
  storage_path: string;
  file_type: string;
  dimensions: {
    width: number;
    height: number;
  };
  is_nsfw: boolean;
  manual_edits?: any;
  created_at: string;
  assetUrl: string;
  filename: string;
  formatName: string;
  platformName?: string;
}

export interface JobResults {
  [platformName: string]: GeneratedAsset[];
}

// Template Types (for UI)
export interface TemplateItem {
  id: string;
  name: string;
  dimensions: string;
  ratio: string;
  iconRatio: 'tall' | 'wide' | 'square' | 'medium' | 'skyscraper';
  width: number;
  height: number;
}

export interface TemplateCategory {
  category: string;
  items: TemplateItem[];
}

// Provider Types
export interface AIProvider {
  name: string;
  enabled: boolean;
  priority?: number;
}

export interface ProvidersResponse {
  providers: string[];
  default_provider?: string;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// Upload Types
export interface UploadResponse {
  project_id: string;
  summary: {
    total_files: number;
    successful_uploads: number;
    failed_uploads: number;
  };
  failed_files?: string[];
}

// Download Types
export interface DownloadRequest {
  assetIds: string[];
  format: 'jpeg' | 'png';
  quality: 'high' | 'medium' | 'low';
  grouping: 'individual' | 'batch' | 'category';
}

export interface DownloadResponse {
  downloadUrl: string;
}