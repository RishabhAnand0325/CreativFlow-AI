import { useCallback } from 'react';
import type { GeneratedAsset, CropBox } from '../types';

export const useCropBox = (
  currentAsset: GeneratedAsset | null,
  containerWidth: number,
  containerHeight: number,
  onCropBoxChange: (cropBox: Partial<CropBox>) => void
) => {
  const handleCropDragStop = useCallback((_e: any, d: { x: number; y: number }) => {
    if (!currentAsset) return;

    const scaleX = currentAsset.dimensions.width / containerWidth;
    const scaleY = currentAsset.dimensions.height / containerHeight;

    const actualX = Math.max(0, d.x * scaleX);
    const actualY = Math.max(0, d.y * scaleY);

    // Ensure crop box stays within image bounds
    const maxX = currentAsset.dimensions.width - (currentAsset.dimensions.width / containerWidth * d.width);
    const maxY = currentAsset.dimensions.height - (currentAsset.dimensions.height / containerHeight * d.height);
    
    const boundedX = Math.min(actualX, maxX);
    const boundedY = Math.min(actualY, maxY);

    onCropBoxChange({ x: boundedX, y: boundedY });
  }, [currentAsset, containerWidth, containerHeight, onCropBoxChange]);

  const handleCropResizeStop = useCallback((
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    if (!currentAsset) return;

    const scaleX = currentAsset.dimensions.width / containerWidth;
    const scaleY = currentAsset.dimensions.height / containerHeight;

    const actualWidth = parseFloat(ref.style.width) * scaleX;
    const actualHeight = parseFloat(ref.style.height) * scaleY;
    const actualX = position.x * scaleX;
    const actualY = position.y * scaleY;

    // Ensure crop box stays within image bounds
    const maxWidth = currentAsset.dimensions.width - actualX;
    const maxHeight = currentAsset.dimensions.height - actualY;
    
    const boundedWidth = Math.min(actualWidth, maxWidth);
    const boundedHeight = Math.min(actualHeight, maxHeight);

    onCropBoxChange({
      width: boundedWidth,
      height: boundedHeight,
      x: actualX,
      y: actualY,
    });
  }, [currentAsset, containerWidth, containerHeight, onCropBoxChange]);

  return { handleCropDragStop, handleCropResizeStop };
};