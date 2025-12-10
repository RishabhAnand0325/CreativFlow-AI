// Shared TypeScript types for frontend services and components

export interface ProvidersResponse {
  providers: string[];
  default_provider?: string;
}

export interface AssetFormat {
  id: string;
  name: string;
  platformId?: string;
  platformName?: string;
  platform_name?: string;
  width: number;
  height: number;
  description?: string;
}

export interface FormatsResponse {
  resizing?: AssetFormat[];
  repurposing?: AssetFormat[];
}

export interface GenerationRequest {
  projectId: string;
  formatIds: string[];
  customResizes?: { width: number; height: number }[];
  provider?: string;
}

export interface GenerationJob {
  jobId?: string;
  id?: string;
  status?: string;
}

export interface GeneratedAsset {
  id: string;
  formatId?: string;
  url?: string;
  assetUrl?: string;  // Alternative to url
  width?: number;
  height?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  filename?: string;
  formatName?: string;
  createdAt?: string;
  format?: {
    id: string;
    name: string;
  };
}

export interface JobResults {
  assets: GeneratedAsset[];
}

export interface DownloadRequest {
  assetIds: string[];
  format: string;
  quality: string;
  grouping: string;
}

export interface DownloadResponse {
  downloadUrl: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  opacity?: number;
}

export interface LogoOverlay {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  aspectRatio?: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAdjustments {
  cropArea: number;
  colorSaturation: number;
  brightness: number;
  contrast: number;
  cropBox: CropBox;
  textOverlays: TextOverlay[];
  logoOverlays: LogoOverlay[];
}
