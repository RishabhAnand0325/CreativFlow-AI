import { useState, useEffect } from 'react';
import type { GeneratedAsset } from '../types';

export const useContainerSize = (currentAsset?: GeneratedAsset | null) => {
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 500,
  });

  useEffect(() => {
    const computeContainerSize = () => {
      try {
        // Reserve space for header/top controls and side paddings
        const reservedVertical = 140; // header + top margins
        const availableHeight = Math.max(360, window.innerHeight - reservedVertical);
        
        const aspect = currentAsset 
          ? (currentAsset.dimensions.width / currentAsset.dimensions.height) 
          : 1;
        
        // Compute width to match the available height while staying within viewport width
        const widthFromHeight = Math.round(availableHeight * aspect);
        const reservedHorizontal = 360; // sidebar + paddings
        const maxWidthAllowed = Math.max(480, window.innerWidth - reservedHorizontal);

        // Prefer the width calculated from height, but never exceed available max width
        const preferredWidth = Math.min(widthFromHeight, maxWidthAllowed);
        const preferredHeight = Math.round(availableHeight * 0.92);

        setContainerSize({
          width: Math.max(480, preferredWidth),
          height: Math.max(300, preferredHeight),
        });
      } catch (error) {
        console.error('Error computing container size:', error);
        setContainerSize({
          width: 600,
          height: 400,
        });
      }
    };

    computeContainerSize();

    // Add resize listener
    window.addEventListener('resize', computeContainerSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', computeContainerSize);
    };
  }, [currentAsset]);

  return containerSize;
};