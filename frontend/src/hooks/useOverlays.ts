import { useCallback } from 'react';
import type { GeneratedAsset, TextOverlay, LogoOverlay } from '../types';

export const useOverlays = (
  currentAsset: GeneratedAsset | null,
  containerWidth: number,
  containerHeight: number,
  onTextOverlayChange: (id: string, updates: Partial<TextOverlay>) => void,
  onLogoOverlayChange: (id: string, updates: Partial<LogoOverlay>) => void
) => {
  const scaleToImage = useCallback((val: number, container: number, image: number) => {
    return val * (image / container);
  }, []);

  const handleTextDragStop = useCallback((id: string) => (_e: any, d: { x: number; y: number }) => {
    if (!currentAsset) return;
    const actualX = scaleToImage(d.x, containerWidth, currentAsset.dimensions.width);
    const actualY = scaleToImage(d.y, containerHeight, currentAsset.dimensions.height);
    onTextOverlayChange(id, { x: actualX, y: actualY });
  }, [currentAsset, containerWidth, containerHeight, scaleToImage, onTextOverlayChange]);

  const handleTextResizeStop = useCallback((id: string, text: string) => (
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    if (!currentAsset) return;

    const newWidth = parseFloat(ref.style.width);
    const newHeight = parseFloat(ref.style.height);
    
    const actualWidth = scaleToImage(newWidth, containerWidth, currentAsset.dimensions.width);
    const actualHeight = scaleToImage(newHeight, containerHeight, currentAsset.dimensions.height);
    const actualX = scaleToImage(position.x, containerWidth, currentAsset.dimensions.width);
    const actualY = scaleToImage(position.y, containerHeight, currentAsset.dimensions.height);

    // Calculate font size based on height (approximate)
    const newFontSize = Math.max(12, actualHeight * 0.8);

    onTextOverlayChange(id, {
      x: actualX,
      y: actualY,
      width: actualWidth,
      height: actualHeight,
      fontSize: newFontSize,
    });
  }, [currentAsset, containerWidth, containerHeight, scaleToImage, onTextOverlayChange]);

  const handleLogoDragStop = useCallback((id: string) => (_e: any, d: { x: number; y: number }) => {
    if (!currentAsset) return;
    const actualX = scaleToImage(d.x, containerWidth, currentAsset.dimensions.width);
    const actualY = scaleToImage(d.y, containerHeight, currentAsset.dimensions.height);
    onLogoOverlayChange(id, { x: actualX, y: actualY });
  }, [currentAsset, containerWidth, containerHeight, scaleToImage, onLogoOverlayChange]);

  const handleLogoResizeStop = useCallback((id: string) => (
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    if (!currentAsset) return;
    const newWidth = parseFloat(ref.style.width);
    const newHeight = parseFloat(ref.style.height);
    
    const actualWidth = scaleToImage(newWidth, containerWidth, currentAsset.dimensions.width);
    const actualHeight = scaleToImage(newHeight, containerHeight, currentAsset.dimensions.height);
    const actualX = scaleToImage(position.x, containerWidth, currentAsset.dimensions.width);
    const actualY = scaleToImage(position.y, containerHeight, currentAsset.dimensions.height);
    
    onLogoOverlayChange(id, { 
      width: actualWidth, 
      height: actualHeight, 
      x: actualX, 
      y: actualY 
    });
  }, [currentAsset, containerWidth, containerHeight, scaleToImage, onLogoOverlayChange]);

  return {
    handleTextDragStop,
    handleTextResizeStop,
    handleLogoDragStop,
    handleLogoResizeStop,
  };
};