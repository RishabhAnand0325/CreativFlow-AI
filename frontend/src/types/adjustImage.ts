export interface CropBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface LogoOverlay {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
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

export interface TextStyle {
  id: string;
  title: string;
  subtitle: string;
  fontFamily: string;
  color: string;
  sizePct: number;
}