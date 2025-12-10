import React from 'react';
import { Rnd } from 'react-rnd';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import { getFullImageUrl } from '../../utils/url';
import type { GeneratedAsset, ImageAdjustments, CropBox, TextOverlay, LogoOverlay } from '../../types';
import { useCropBox } from '../../hooks/useCropBox';
import { useOverlays } from '../../hooks/useOverlays';
import styles from './ImageCanvas.module.css';

interface ImageCanvasProps {
  currentAsset: GeneratedAsset | null;
  adjustments: ImageAdjustments;
  containerWidth: number;
  containerHeight: number;
  onCropBoxChange: (cropBox: Partial<CropBox>) => void;
  onTextOverlayChange: (id: string, updates: Partial<TextOverlay>) => void;
  onLogoOverlayChange: (id: string, updates: Partial<LogoOverlay>) => void;
  onRemoveText: (id: string) => void;
  onRemoveLogo: (id: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  currentAsset,
  adjustments,
  containerWidth,
  containerHeight,
  onCropBoxChange,
  onTextOverlayChange,
  onLogoOverlayChange,
  onRemoveText,
  onRemoveLogo,
}) => {
  const { handleCropDragStop, handleCropResizeStop } = useCropBox(
    currentAsset,
    containerWidth,
    containerHeight,
    onCropBoxChange
  );

  const { 
    handleTextDragStop, 
    handleTextResizeStop, 
    handleLogoDragStop, 
    handleLogoResizeStop 
  } = useOverlays(
    currentAsset,
    containerWidth,
    containerHeight,
    onTextOverlayChange,
    onLogoOverlayChange
  );

  if (!currentAsset) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-gray-400">No image selected</div>
      </div>
    );
  }

  // Calculate scaling factors
  const scaleX = containerWidth / currentAsset.dimensions.width;
  const scaleY = containerHeight / currentAsset.dimensions.height;

  // Calculate scaled dimensions for display
  const scaledCropBox = {
    width: adjustments.cropBox.width * scaleX,
    height: adjustments.cropBox.height * scaleY,
    x: adjustments.cropBox.x * scaleX,
    y: adjustments.cropBox.y * scaleY,
  };

  return (
    <div className="bg-[#243033] rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-300">
          {`${currentAsset.filename} for ${currentAsset.formatName} (${currentAsset.dimensions.width}x${currentAsset.dimensions.height})`}
        </div>
      </div>

      <div className="w-full flex justify-center">
        <div
          className="editable-image relative overflow-hidden bg-[#2b3537] rounded"
          style={{ 
            width: `${containerWidth}px`, 
            height: `${containerHeight}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <AuthenticatedImage
            src={getFullImageUrl(currentAsset.assetUrl)}
            alt={currentAsset.formatName}
            className="w-full h-full object-contain absolute top-0 left-0"
            style={{
              filter: `saturate(${100 + adjustments.colorSaturation}%) brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`,
            }}
            placeholder={
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                Loading image...
              </div>
            }
          />

          {/* Crop Box */}
          <Rnd
            className={styles.cropBox}
            size={{
              width: scaledCropBox.width,
              height: scaledCropBox.height,
            }}
            position={{
              x: scaledCropBox.x,
              y: scaledCropBox.y,
            }}
            onDragStop={handleCropDragStop}
            onResizeStop={handleCropResizeStop}
            bounds="parent"
            minWidth={20}
            minHeight={20}
            enableResizing={{
              topLeft: true,
              topRight: true,
              bottomLeft: true,
              bottomRight: true,
              top: true,
              right: true,
              bottom: true,
              left: true
            }}
            resizeHandleClasses={{
              topLeft: styles.cropHandle,
              top: styles.cropHandle,
              topRight: styles.cropHandle,
              right: styles.cropHandle,
              bottomRight: styles.cropHandle,
              bottom: styles.cropHandle,
              bottomLeft: styles.cropHandle,
              left: styles.cropHandle,
            }}
          />

          {/* Text Overlays */}
          {adjustments.textOverlays.map((textOverlay) => (
            <TextOverlayComponent
              key={textOverlay.id}
              overlay={textOverlay}
              scaleX={scaleX}
              scaleY={scaleY}
              onDragStop={handleTextDragStop(textOverlay.id)}
              onResizeStop={handleTextResizeStop(textOverlay.id, textOverlay.text)}
              onRemove={() => onRemoveText(textOverlay.id)}
            />
          ))}

          {/* Logo Overlays */}
          {adjustments.logoOverlays.map((logoOverlay) => (
            <LogoOverlayComponent
              key={logoOverlay.id}
              overlay={logoOverlay}
              scaleX={scaleX}
              scaleY={scaleY}
              onDragStop={handleLogoDragStop(logoOverlay.id)}
              onResizeStop={handleLogoResizeStop(logoOverlay.id)}
              onRemove={() => onRemoveLogo(logoOverlay.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TextOverlayComponent: React.FC<{
  overlay: TextOverlay;
  scaleX: number;
  scaleY: number;
  onDragStop: any;
  onResizeStop: any;
  onRemove: () => void;
}> = ({ overlay, scaleX, scaleY, onDragStop, onResizeStop, onRemove }) => {
  const scaledOverlay = {
    width: (overlay.width || overlay.text.length * 15) * scaleX,
    height: (overlay.height || 30) * scaleY,
    x: overlay.x * scaleX,
    y: overlay.y * scaleY,
    fontSize: overlay.fontSize * scaleX,
  };

  return (
    <Rnd
      className={styles.textOverlay}
      size={{ 
        width: scaledOverlay.width, 
        height: scaledOverlay.height 
      }}
      position={{ 
        x: scaledOverlay.x, 
        y: scaledOverlay.y 
      }}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      bounds="parent"
      minWidth={50}
      minHeight={30}
      enableResizing={{
        topLeft: true,
        topRight: true,
        bottomLeft: true,
        bottomRight: true,
        top: true,
        right: true,
        bottom: true,
        left: true
      }}
      resizeHandleClasses={{
        topLeft: styles.overlayHandle,
        top: styles.overlayHandle,
        topRight: styles.overlayHandle,
        right: styles.overlayHandle,
        bottomRight: styles.overlayHandle,
        bottom: styles.overlayHandle,
        bottomLeft: styles.overlayHandle,
        left: styles.overlayHandle,
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          fontSize: `${scaledOverlay.fontSize}px`,
          color: overlay.color,
          fontFamily: overlay.fontFamily,
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {overlay.text}
        <button
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </div>
    </Rnd>
  );
};

const LogoOverlayComponent: React.FC<{
  overlay: LogoOverlay;
  scaleX: number;
  scaleY: number;
  onDragStop: any;
  onResizeStop: any;
  onRemove: () => void;
}> = ({ overlay, scaleX, scaleY, onDragStop, onResizeStop, onRemove }) => {
  const scaledOverlay = {
    width: overlay.width * scaleX,
    height: overlay.height * scaleY,
    x: overlay.x * scaleX,
    y: overlay.y * scaleY,
  };

  return (
    <Rnd
      className={styles.logoOverlay}
      size={{
        width: scaledOverlay.width,
        height: scaledOverlay.height,
      }}
      position={{
        x: scaledOverlay.x,
        y: scaledOverlay.y,
      }}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      bounds="parent"
      minWidth={50}
      minHeight={50}
      enableResizing={{
        topLeft: true,
        topRight: true,
        bottomLeft: true,
        bottomRight: true,
        top: true,
        right: true,
        bottom: true,
        left: true
      }}
      resizeHandleClasses={{
        topLeft: styles.overlayHandle,
        top: styles.overlayHandle,
        topRight: styles.overlayHandle,
        right: styles.overlayHandle,
        bottomRight: styles.overlayHandle,
        bottom: styles.overlayHandle,
        bottomLeft: styles.overlayHandle,
        left: styles.overlayHandle,
      }}
    >
      <div className="relative w-full h-full">
        <img
          src={overlay.imageUrl}
          alt="Logo"
          className="w-full h-full object-contain"
          style={{ opacity: overlay.opacity }}
        />
        <button
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </div>
    </Rnd>
  );
};