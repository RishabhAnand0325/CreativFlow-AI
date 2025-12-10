import { useState, useCallback } from 'react';
import { generation } from '../services/generation';
import { useApi } from './useApi';
import type { GeneratedAsset, ImageAdjustments, CropBox, TextOverlay, LogoOverlay } from '../types';

const initialAdjustments: ImageAdjustments = {
  cropArea: 100,
  colorSaturation: 0,
  brightness: 0,
  contrast: 0,
  cropBox: {
    width: 300,
    height: 300,
    x: 50,
    y: 50,
  },
  textOverlays: [],
  logoOverlays: [],
};

export const useImageEditor = (currentAsset: GeneratedAsset | null) => {
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(initialAdjustments);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showTextStylesView, setShowTextStylesView] = useState<boolean>(false);
  
  const applyEditsApi = useApi(generation.applyManualEdits);

  const handleAdjustmentChange = useCallback((key: keyof ImageAdjustments, value: any) => {
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleCropBoxChange = useCallback((newCropBox: Partial<CropBox>) => {
    setAdjustments(prev => ({
      ...prev,
      cropBox: { ...prev.cropBox, ...newCropBox },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleTextOverlayChange = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setAdjustments(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(overlay =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      ),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleLogoOverlayChange = useCallback((id: string, updates: Partial<LogoOverlay>) => {
    setAdjustments(prev => ({
      ...prev,
      logoOverlays: prev.logoOverlays.map(overlay =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      ),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleAddTextOverlay = useCallback((text: string, color: string = '#ffffff') => {
    if (!currentAsset) return;

    const textOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: text,
      x: currentAsset.dimensions.width * 0.5,
      y: currentAsset.dimensions.height * 0.5,
      fontSize: Math.max(24, currentAsset.dimensions.width * 0.05),
      color: color,
      fontFamily: 'Arial, sans-serif',
      width: text.length * 20, // Approximate width
      height: 30, // Approximate height
    };

    setAdjustments(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, textOverlay],
    }));
    setHasUnsavedChanges(true);
  }, [currentAsset]);

  const handleAddLogoOverlay = useCallback((logoFile: File) => {
    if (!currentAsset) return;

    const logoUrl = URL.createObjectURL(logoFile);
    const logoOverlay: LogoOverlay = {
      id: `logo-${Date.now()}`,
      imageUrl: logoUrl,
      x: currentAsset.dimensions.width * 0.1,
      y: currentAsset.dimensions.height * 0.1,
      width: Math.min(200, currentAsset.dimensions.width * 0.25),
      height: Math.min(200, currentAsset.dimensions.width * 0.25),
      opacity: 1,
    };

    setAdjustments(prev => ({
      ...prev,
      logoOverlays: [...prev.logoOverlays, logoOverlay],
    }));
    setHasUnsavedChanges(true);
  }, [currentAsset]);

  const handleRemoveText = useCallback((textId: string) => {
    setAdjustments(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.filter(t => t.id !== textId),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleRemoveLogo = useCallback((logoId: string) => {
    setAdjustments(prev => ({
      ...prev,
      logoOverlays: prev.logoOverlays.filter(l => l.id !== logoId),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleApplyChanges = useCallback(async () => {
    if (!currentAsset) {
      throw new Error('No asset selected');
    }

    // Check if there are any changes to apply
    const hasChanges = adjustments.textOverlays.length > 0 || 
                      adjustments.logoOverlays.length > 0 || 
                      adjustments.colorSaturation !== 0 ||
                      adjustments.cropBox.x !== 0 ||
                      adjustments.cropBox.y !== 0 ||
                      adjustments.cropBox.width !== currentAsset.dimensions.width ||
                      adjustments.cropBox.height !== currentAsset.dimensions.height;

    if (!hasChanges) {
      throw new Error('No changes to apply');
    }

    // Get image dimensions for normalization
    const imageDimensions = currentAsset.dimensions;
    
    // Normalize crop coordinates to 0-1 range
    const normalizedCrop = {
      x: Math.max(0, Math.min(1, adjustments.cropBox.x / imageDimensions.width)),
      y: Math.max(0, Math.min(1, adjustments.cropBox.y / imageDimensions.height)),
      width: Math.max(0.1, Math.min(1, adjustments.cropBox.width / imageDimensions.width)),
      height: Math.max(0.1, Math.min(1, adjustments.cropBox.height / imageDimensions.height)),
    };

    // Ensure crop area doesn't extend beyond image boundaries
    if (normalizedCrop.x + normalizedCrop.width > 1) {
      normalizedCrop.width = 1 - normalizedCrop.x;
    }
    if (normalizedCrop.y + normalizedCrop.height > 1) {
      normalizedCrop.height = 1 - normalizedCrop.y;
    }

    // Normalize text overlay positions
    const normalizedTextOverlays = adjustments.textOverlays.map(overlay => ({
      text: overlay.text,
      x: overlay.x / imageDimensions.width,
      y: overlay.y / imageDimensions.height,
      style_set_id: null,
      style_type: "content"
    }));

    // Process logo overlays
    const normalizedLogoOverlays: any[] = [];
    
    if (adjustments.logoOverlays.length > 0) {
      for (const logoOverlay of adjustments.logoOverlays) {
        try {
          let serverLogoPath = logoOverlay.imageUrl;
          // If it's a blob URL, upload it to server
          if (logoOverlay.imageUrl.startsWith('blob:')) {
            const resp = await fetch(logoOverlay.imageUrl);
            const blob = await resp.blob();
            const file = new File([blob], `logo_${Date.now()}.png`, { type: blob.type || 'image/png' });
            const uploadResp = await generation.uploadLogo(file);
            serverLogoPath = uploadResp.logo_path;
          }

          normalizedLogoOverlays.push({
            logo_path: serverLogoPath,
            x: logoOverlay.x / imageDimensions.width,
            y: logoOverlay.y / imageDimensions.height,
            width: logoOverlay.width,
            height: logoOverlay.height
          });
        } catch (e) {
          console.warn('Error processing logo overlay', e);
          continue;
        }
      }
    }

    // Normalize saturation to -1 to 1 range
    const normalizedSaturation = adjustments.colorSaturation / 100;

    const edits = {
      crop: normalizedCrop,
      saturation: normalizedSaturation,
      text_overlays: normalizedTextOverlays,
      logo_overlays: normalizedLogoOverlays,
    };

    await applyEditsApi.execute(currentAsset.id, edits);
    setHasUnsavedChanges(false);

    // Clear overlays since they're now part of the image
    setAdjustments(prev => ({
      ...prev,
      textOverlays: [],
      logoOverlays: [],
      colorSaturation: 0,
      cropBox: {
        width: currentAsset.dimensions.width,
        height: currentAsset.dimensions.height,
        x: 0,
        y: 0,
      }
    }));

    // Refresh the asset
    const updatedAsset = await generation.getGeneratedAsset(currentAsset.id);
    return updatedAsset;
  }, [currentAsset, adjustments, applyEditsApi]);

  const handleCompositeAndDownload = useCallback(async () => {
    if (!currentAsset) return;

    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      return new Promise(async (resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = async () => {
          try {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error('Failed to fetch image');
            const blob = await resp.blob();
            const objectUrl = URL.createObjectURL(blob);
            const img2 = new Image();
            img2.onload = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(img2);
            };
            img2.onerror = (e) => reject(e);
            img2.src = objectUrl;
          } catch (e) {
            reject(e);
          }
        };
        img.src = src;
      });
    };

    try {
      const baseUrl = currentAsset.assetUrl;
      const baseImg = await loadImage(baseUrl);

      const canvas = document.createElement('canvas');
      canvas.width = currentAsset.dimensions.width;
      canvas.height = currentAsset.dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');

      // Draw base image
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Apply crop
      const crop = adjustments.cropBox;
      const imageData = ctx.getImageData(crop.x, crop.y, crop.width, crop.height);
      canvas.width = crop.width;
      canvas.height = crop.height;
      ctx.putImageData(imageData, 0, 0);

      // Draw logos
      for (const logo of adjustments.logoOverlays) {
        try {
          const limg = await loadImage(logo.imageUrl);
          ctx.globalAlpha = typeof logo.opacity === 'number' ? logo.opacity : 1;
          ctx.drawImage(limg, logo.x - crop.x, logo.y - crop.y, logo.width, logo.height);
          ctx.globalAlpha = 1;
        } catch (e) {
          console.warn('Logo draw failed', e);
        }
      }

      // Draw texts
      for (const t of adjustments.textOverlays) {
        ctx.save();
        ctx.fillStyle = t.color || '#fff';
        const fontSize = Math.max(12, Math.round(t.fontSize));
        const family = t.fontFamily ? t.fontFamily.split(',')[0] : 'sans-serif';
        ctx.font = `${fontSize}px ${family}`;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 4;
        ctx.fillText(t.text, Math.round(t.x - crop.x), Math.round(t.y - crop.y));
        ctx.restore();
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = `${currentAsset.filename || 'image'}_edited.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Composite download error', err);
      // Fallback to original download
      await generation.downloadSingleAsset(currentAsset.id);
    }
  }, [currentAsset, adjustments]);

  return {
    adjustments,
    hasUnsavedChanges,
    showTextStylesView,
    setShowTextStylesView,
    setHasUnsavedChanges,
    handleAdjustmentChange,
    handleCropBoxChange,
    handleTextOverlayChange,
    handleLogoOverlayChange,
    handleAddTextOverlay,
    handleAddLogoOverlay,
    handleRemoveText,
    handleRemoveLogo,
    handleApplyChanges,
    handleCompositeAndDownload,
    applyEditsApi,
    setAdjustments,
  };
};