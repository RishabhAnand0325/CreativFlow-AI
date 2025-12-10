import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { generation } from '../../services/generation';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import { getFullImageUrl } from '../../utils/url';
import type { GeneratedAsset } from '../../types';

interface CropBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface LogoOverlay {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface ImageAdjustments {
  cropArea: number;
  colorSaturation: number;
  brightness: number;
  contrast: number;
  cropBox: CropBox;
  textOverlays: TextOverlay[];
  logoOverlays: LogoOverlay[];
}

const AdjustImagePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, setTheme } = useAppContext();
  const { logout } = useAuth();

  // URL parameters
  const assetId = searchParams.get('assetId');
  const jobId = searchParams.get('jobId');

  // Local state
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Image adjustments state
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
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
  });

  // UI state for adding text/logo
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showTextStylesView, setShowTextStylesView] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');

  // API hooks (only for apply edits)
  const applyEditsApi = useApi(generation.applyManualEdits);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.add-dropdown-container')) {
          setShowAddDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDropdown]);

  // Load data on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true; // Prevent state updates if component unmounts

    const loadAssetData = async () => {
      if (!assetId && !jobId) {
        if (isMounted) setError('No asset or job ID provided');
        return;
      }

      try {
        if (isMounted) setError('');

        if (assetId) {
          // Load specific asset directly using the service
          console.log('Loading asset with ID:', assetId);
          const asset = await generation.getGeneratedAsset(assetId);
          if (isMounted && asset) {
            setCurrentAsset(asset);
            setCurrentIndex(0);
            setTotalAssets(1);
            
            // Initialize crop box based on asset dimensions
            const cropSize = Math.min(asset.dimensions.width, asset.dimensions.height) * 0.8;
            const cropX = (asset.dimensions.width - cropSize) / 2;
            const cropY = (asset.dimensions.height - cropSize) / 2;
            
            setAdjustments(prev => ({
              ...prev,
              cropBox: {
                width: cropSize,
                height: cropSize,
                x: cropX,
                y: cropY,
              }
            }));
            
            console.log('Asset loaded successfully:', asset);
          } else if (isMounted) {
            setError('Asset not found');
          }
        } else if (jobId) {
          // Load job results directly using the service
          const results = await generation.getJobResults(jobId);
          if (isMounted && results) {
            const allAssets = Object.values(results).flat();

            if (allAssets.length > 0) {
              const asset = allAssets[0];
              setCurrentAsset(asset);
              setCurrentIndex(0);
              setTotalAssets(allAssets.length);
              
              // Initialize crop box based on asset dimensions
              const cropSize = Math.min(asset.dimensions.width, asset.dimensions.height) * 0.8;
              const cropX = (asset.dimensions.width - cropSize) / 2;
              const cropY = (asset.dimensions.height - cropSize) / 2;
              
              setAdjustments(prev => ({
                ...prev,
                cropBox: {
                  width: cropSize,
                  height: cropSize,
                  x: cropX,
                  y: cropY,
                }
              }));
            } else {
              setError('No assets found for this job');
            }
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setError(error.message || 'Failed to load asset data');
        }
      }
    };

    loadAssetData();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [navigate, assetId, jobId]); // Only depend on URL params

  // Handle adjustment changes
  const handleAdjustmentChange = useCallback((key: keyof ImageAdjustments, value: any) => {
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle crop box changes
  const handleCropBoxChange = useCallback((newCropBox: Partial<CropBox>) => {
    setAdjustments(prev => ({
      ...prev,
      cropBox: { ...prev.cropBox, ...newCropBox },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Add text overlay
  const handleAddText = () => {
    if (!newText.trim() || !currentAsset) return;

    const textOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: newText,
      x: currentAsset.dimensions.width * 0.5, // Center horizontally
      y: currentAsset.dimensions.height * 0.5, // Center vertically
      fontSize: Math.max(24, currentAsset.dimensions.width * 0.05), // Scale font size
      color: selectedTextColor,
      fontFamily: 'Arial, sans-serif',
    };

    setAdjustments(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, textOverlay],
    }));

    setNewText('');
    setShowTextDialog(false);
    setHasUnsavedChanges(true);
  };

  // Add logo overlay
  const handleAddLogo = (logoFile: File) => {
    if (!currentAsset) return;
    
    const logoUrl = URL.createObjectURL(logoFile);

    const logoOverlay: LogoOverlay = {
      id: `logo-${Date.now()}`,
      imageUrl: logoUrl,
      x: currentAsset.dimensions.width * 0.1, // 10% from left
      y: currentAsset.dimensions.height * 0.1, // 10% from top
      width: Math.min(100, currentAsset.dimensions.width * 0.2), // 20% of image width or 100px max
      height: Math.min(100, currentAsset.dimensions.width * 0.2), // Keep square
      opacity: 1,
    };

    setAdjustments(prev => ({
      ...prev,
      logoOverlays: [...prev.logoOverlays, logoOverlay],
    }));

    setShowLogoDialog(false);
    setHasUnsavedChanges(true);
  };

  // Remove text overlay
  const handleRemoveText = (textId: string) => {
    setAdjustments(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.filter(t => t.id !== textId),
    }));
    setHasUnsavedChanges(true);
  };

  // Remove logo overlay
  const handleRemoveLogo = (logoId: string) => {
    setAdjustments(prev => ({
      ...prev,
      logoOverlays: prev.logoOverlays.filter(l => l.id !== logoId),
    }));
    setHasUnsavedChanges(true);
  };

  // Apply changes to the asset
  const handleApplyChanges = async () => {
    if (!currentAsset) {
      setError('No asset selected');
      return;
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
      setError('No changes to apply');
      return;
    }

    try {
      setError('');

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
        style_set_id: null, // Use default style
        style_type: "content"
      }));

      // Process logo overlays - upload files to server first
      const normalizedLogoOverlays: any[] = [];
      
      if (adjustments.logoOverlays.length > 0) {
        console.log('Processing logo overlays...');
        // For now, we'll create placeholder logo overlays
        // In a full implementation, you would upload the logo files to the server first
        for (const logoOverlay of adjustments.logoOverlays) {
          // Skip blob URLs for now - in production you'd upload the file first
          if (logoOverlay.imageUrl.startsWith('blob:')) {
            console.warn('Skipping blob URL logo overlay - file upload not implemented');
            continue;
          }
          
          normalizedLogoOverlays.push({
            logo_path: logoOverlay.imageUrl, // This should be a server path after upload
            x: logoOverlay.x / imageDimensions.width,
            y: logoOverlay.y / imageDimensions.height,
            width: logoOverlay.width,
            height: logoOverlay.height
          });
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

      console.log('Applying edits:', edits);    
      console.log('Text overlays being sent:', normalizedTextOverlays);
      console.log('Logo overlays being sent:', normalizedLogoOverlays);
      await applyEditsApi.execute(currentAsset.id, edits);
      setHasUnsavedChanges(false);

      // Show success message
      alert('Changes applied successfully!');
      
      // Clear overlays since they're now part of the image
      setAdjustments(prev => ({
        ...prev,
        textOverlays: [],
        logoOverlays: [],
        colorSaturation: 0, // Reset saturation since it's now applied
        cropBox: {
          width: currentAsset.dimensions.width,
          height: currentAsset.dimensions.height,
          x: 0,
          y: 0,
        }
      }));
      
      // Refresh the asset to show updated version
      const refreshAsset = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            // Wait a bit for the file to be fully written
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            
            const updatedAsset = await generation.getGeneratedAsset(currentAsset.id);
            console.log('Updated asset after edit:', updatedAsset);
            console.log('Old asset URL:', currentAsset.assetUrl);
            console.log('New asset URL:', updatedAsset.assetUrl);
            setCurrentAsset(updatedAsset);
            
            // Force image refresh by adding timestamp to URL
            const imageElement = document.querySelector('.editable-image img') as HTMLImageElement;
            if (imageElement) {
              const newUrl = updatedAsset.assetUrl + '?t=' + Date.now();
              imageElement.src = newUrl;
            }
            return; // Success, exit retry loop
          } catch (refreshError: any) {
            console.warn(`Attempt ${i + 1} to refresh asset failed:`, refreshError);
            if (i === retries - 1) {
              // Last attempt failed
              console.error('Could not refresh asset after edit:', refreshError);
              setError(`Edit applied but could not refresh preview: ${refreshError.message}`);
            }
          }
        }
      };
      
      refreshAsset();
    } catch (error: any) {
      console.error('Error applying edits:', error);
      let errorMessage = 'Failed to apply changes';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Add more specific error messages
      if (errorMessage.includes('No such file or directory')) {
        errorMessage = 'Image file not found. The image may have been moved or deleted.';
      } else if (errorMessage.includes('Failed to process image edits')) {
        errorMessage = 'Failed to process image edits. Please try again with simpler edits.';
      }
      
      setError(errorMessage);
      setHasUnsavedChanges(false); // Reset the flag on error
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Load previous asset logic here
    }
  };

  const handleNext = () => {
    if (currentIndex < totalAssets - 1) {
      setCurrentIndex(prev => prev + 1);
      // Load next asset logic here
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    navigate(-1);
  };

  const handleThemeToggle = () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    await logout();
  };



  // Loading state
  if (!currentAsset && !error) {
    return (
      <div className="adjust-image-page-container">
        <div className="loading-message">Loading asset...</div>
      </div>
    );
  }

  return (
    <div className="adjust-image-page-container">
      <header className="navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg className="logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 L80 80 M80 20 L20 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <span className="logo-text">AI CREAT</span>
          </div>
          <nav className="navbar-nav">
            <a href="/user-dashboard" className="nav-item">Dashboard</a>
            <a href="#" className="nav-item active">Recreate</a>
            <a href="#" className="nav-item">Project History</a>
          </nav>
        </div>
        <div className="navbar-right">
          <button
            className="icon-button"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            <i className={state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-bell"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-cog"></i>
          </button>
          <button className="icon-button" onClick={handleLogout} title="Logout">
            <i className="fas fa-sign-out-alt"></i>
          </button>
          <div className="user-profile">
            <img
              src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"
              alt="User"
              className="profile-avatar"
            />
          </div>
        </div>
      </header>

      <main className="adjust-image-main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="back-button" onClick={handleBack}>
              <i className="fas fa-chevron-left"></i> Adjust Image
            </button>
            <p className="description">Manually cropping and adjusting option for the images</p>
          </div>
          <div className="top-bar-actions">
            <button
              className="download-button"
              onClick={async () => {
                if (currentAsset) {
                  try {
                    await generation.downloadSingleAsset(currentAsset.id);
                  } catch (error: any) {
                    console.error('Download failed:', error);
                    setError('Download failed. Please try again.');
                  }
                }
              }}
              disabled={!currentAsset}
            >
              <i className="fas fa-download"></i> Download
            </button>
            <button
              className="apply-changes-button"
              onClick={handleApplyChanges}
              disabled={!hasUnsavedChanges || applyEditsApi.loading}
            >
              {applyEditsApi.loading ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ color: 'red', margin: '1rem 2rem' }}>
            {error}
          </div>
        )}

        <div className="content-area">
          <div className="image-canvas-wrapper">
            <div className="image-info-bar">
              <span className="image-title">
                {currentAsset ?
                  `${currentAsset.filename} for ${currentAsset.formatName} (${currentAsset.dimensions.width}x${currentAsset.dimensions.height})` :
                  'Loading...'
                }
              </span>
              <div className="canvas-controls">
                <span>{currentIndex + 1} of {totalAssets}</span>
                <button
                  className="canvas-nav-button"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  className="canvas-nav-button"
                  onClick={handleNext}
                  disabled={currentIndex >= totalAssets - 1}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <div className="image-canvas">
              {currentAsset && (
                <div
                  className="editable-image"
                  style={{
                    width: '600px',
                    height: `${(600 * currentAsset.dimensions.height) / currentAsset.dimensions.width}px`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <AuthenticatedImage
                    src={getFullImageUrl(currentAsset.assetUrl)}
                    alt={currentAsset.formatName}
                    style={{
                      filter: `saturate(${100 + adjustments.colorSaturation}%) brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                    placeholder={
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        color: '#666'
                      }}>
                        <i className="fas fa-image" style={{ fontSize: '2rem', marginRight: '0.5rem' }}></i>
                        Loading image...
                      </div>
                    }
                  />
                  <Rnd
                    size={{ 
                      width: (adjustments.cropBox.width * 600) / currentAsset.dimensions.width, 
                      height: (adjustments.cropBox.height * 600) / currentAsset.dimensions.width 
                    }}
                    position={{ 
                      x: (adjustments.cropBox.x * 600) / currentAsset.dimensions.width, 
                      y: (adjustments.cropBox.y * 600) / currentAsset.dimensions.width 
                    }}
                    onDragStop={(_, d) => {
                      const actualX = (d.x * currentAsset.dimensions.width) / 600;
                      const actualY = (d.y * currentAsset.dimensions.width) / 600;
                      handleCropBoxChange({ x: actualX, y: actualY });
                    }}
                    onResizeStop={(_, __, ref, ___, position) => {
                      const actualWidth = (parseInt(ref.style.width, 10) * currentAsset.dimensions.width) / 600;
                      const actualHeight = (parseInt(ref.style.height, 10) * currentAsset.dimensions.width) / 600;
                      const actualX = (position.x * currentAsset.dimensions.width) / 600;
                      const actualY = (position.y * currentAsset.dimensions.width) / 600;
                      handleCropBoxChange({
                        width: actualWidth,
                        height: actualHeight,
                        x: actualX,
                        y: actualY,
                      });
                    }}
                    bounds="parent"
                    className="crop-selection-area"
                    minWidth={20}
                    minHeight={20}
                    resizeHandleStyles={{
                      topLeft: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      top: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      topRight: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      right: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      bottomRight: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      bottom: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      bottomLeft: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' },
                      left: { width: '8px', height: '8px', backgroundColor: '#00bcd4', border: '2px solid white' }
                    }}
                  />

                  {/* Text Overlays */}
                  {adjustments.textOverlays.map((textOverlay) => (
                    <Rnd
                      key={textOverlay.id}
                      size={{ 
                        width: (textOverlay.fontSize * textOverlay.text.length * 0.6 * 600) / currentAsset.dimensions.width, 
                        height: (textOverlay.fontSize * 1.2 * 600) / currentAsset.dimensions.width 
                      }}
                      position={{ 
                        x: (textOverlay.x * 600) / currentAsset.dimensions.width, 
                        y: (textOverlay.y * 600) / currentAsset.dimensions.width 
                      }}
                      onDragStop={(_, d) => {
                        const actualX = (d.x * currentAsset.dimensions.width) / 600;
                        const actualY = (d.y * currentAsset.dimensions.width) / 600;
                        setAdjustments(prev => ({
                          ...prev,
                          textOverlays: prev.textOverlays.map(t =>
                            t.id === textOverlay.id ? { ...t, x: actualX, y: actualY } : t
                          ),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      onResizeStop={(_, __, ref, ___, position) => {
                        const newWidth = parseInt(ref.style.width, 10);
                        const newFontSize = (newWidth * currentAsset.dimensions.width) / (600 * textOverlay.text.length * 0.6);
                        const actualX = (position.x * currentAsset.dimensions.width) / 600;
                        const actualY = (position.y * currentAsset.dimensions.width) / 600;
                        setAdjustments(prev => ({
                          ...prev,
                          textOverlays: prev.textOverlays.map(t =>
                            t.id === textOverlay.id ? { 
                              ...t, 
                              x: actualX, 
                              y: actualY, 
                              fontSize: Math.max(12, newFontSize) 
                            } : t
                          ),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      bounds="parent"
                      className="text-overlay"
                      enableResizing={true}
                      minWidth={20}
                      minHeight={15}
                      resizeHandleStyles={{
                        topLeft: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        top: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        topRight: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        right: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottomRight: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottom: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottomLeft: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        left: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' }
                      }}
                    >
                      <div
                        style={{
                          fontSize: `${(textOverlay.fontSize * 600) / currentAsset.dimensions.width}px`,
                          color: textOverlay.color,
                          fontFamily: textOverlay.fontFamily,
                          cursor: 'move',
                          userSelect: 'none',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {textOverlay.text}
                        <button
                          className="overlay-remove-btn"
                          onClick={() => handleRemoveText(textOverlay.id)}
                        >
                          ×
                        </button>
                      </div>
                    </Rnd>
                  ))}

                  {/* Logo Overlays */}
                  {adjustments.logoOverlays.map((logoOverlay) => (
                    <Rnd
                      key={logoOverlay.id}
                      size={{ 
                        width: (logoOverlay.width * 600) / currentAsset.dimensions.width, 
                        height: (logoOverlay.height * 600) / currentAsset.dimensions.width 
                      }}
                      position={{ 
                        x: (logoOverlay.x * 600) / currentAsset.dimensions.width, 
                        y: (logoOverlay.y * 600) / currentAsset.dimensions.width 
                      }}
                      onDragStop={(_, d) => {
                        const actualX = (d.x * currentAsset.dimensions.width) / 600;
                        const actualY = (d.y * currentAsset.dimensions.width) / 600;
                        setAdjustments(prev => ({
                          ...prev,
                          logoOverlays: prev.logoOverlays.map(l =>
                            l.id === logoOverlay.id ? { ...l, x: actualX, y: actualY } : l
                          ),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      onResizeStop={(_, __, ref, ___, position) => {
                        const actualWidth = (parseInt(ref.style.width, 10) * currentAsset.dimensions.width) / 600;
                        const actualHeight = (parseInt(ref.style.height, 10) * currentAsset.dimensions.width) / 600;
                        const actualX = (position.x * currentAsset.dimensions.width) / 600;
                        const actualY = (position.y * currentAsset.dimensions.width) / 600;
                        setAdjustments(prev => ({
                          ...prev,
                          logoOverlays: prev.logoOverlays.map(l =>
                            l.id === logoOverlay.id ? {
                              ...l,
                              width: actualWidth,
                              height: actualHeight,
                              x: actualX,
                              y: actualY,
                            } : l
                          ),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      bounds="parent"
                      className="logo-overlay"
                      minWidth={20}
                      minHeight={20}
                      resizeHandleStyles={{
                        topLeft: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        top: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        topRight: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        right: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottomRight: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottom: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        bottomLeft: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' },
                        left: { width: '6px', height: '6px', backgroundColor: '#00bcd4', border: '1px solid white' }
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img
                          src={logoOverlay.imageUrl}
                          alt="Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            opacity: logoOverlay.opacity,
                          }}
                        />
                        <button
                          className="overlay-remove-btn"
                          onClick={() => handleRemoveLogo(logoOverlay.id)}
                        >
                          ×
                        </button>
                      </div>
                    </Rnd>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="adjustments-sidebar">
            {!showTextStylesView ? (
              <>
                <h3>Adjust</h3>
                <p className="sidebar-description">Click & drag to crop image & reposition elements.</p>
              </>
            ) : (
              <>
                <div className="text-styles-header">
                  <button 
                    className="back-to-adjust-btn"
                    onClick={() => setShowTextStylesView(false)}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <h3>Add Text</h3>
                </div>
                <p className="sidebar-description">Click the Text Style to add text to the image.</p>
              </>
            )}

            <div className="add-content-section">
              <div className="add-dropdown-container">
                <button
                  className="add-text-logo-button"
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                >
                  <i className="fas fa-plus"></i> Add Text or Logo
                  <i className={`fas fa-chevron-${showAddDropdown ? 'up' : 'down'}`}></i>
                </button>
                {showAddDropdown && (
                  <div className="add-dropdown">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowTextStylesView(true);
                        setShowAddDropdown(false);
                      }}
                    >
                      <i className="fas fa-font"></i> Add Text
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowLogoDialog(true);
                        setShowAddDropdown(false);
                      }}
                    >
                      <i className="fas fa-upload"></i> Import from Computer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!showTextStylesView ? (
              <>
                <div className="adjustment-section">
                  <h4>Manual Cropping</h4>
                  <div className="slider-control">
                    <label>Crop Area</label>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.cropArea}
                        onChange={(e) => handleAdjustmentChange('cropArea', Number(e.target.value))}
                        className="custom-range-slider"
                      />
                      <span className="slider-value">{adjustments.cropArea}%</span>
                    </div>
                  </div>
                </div>

                <div className="adjustment-section">
                  <h4>Color Saturation Adjustments</h4>
                  <div className="slider-control">
                    <label>Color Saturation</label>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={adjustments.colorSaturation}
                        onChange={(e) => handleAdjustmentChange('colorSaturation', Number(e.target.value))}
                        className="custom-range-slider"
                      />
                      <span className="slider-value">{adjustments.colorSaturation}</span>
                    </div>
                  </div>
                </div>

                <div className="adjustment-section">
                  <h4>Logo Adjustments</h4>
                  <div className="slider-control">
                    <label>Logo Size</label>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={50}
                        onChange={(e) => {/* Handle logo size */ }}
                        className="custom-range-slider"
                      />
                      <span className="slider-value">50</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-styles-section">
                <div className="text-styles-header-info">
                  <h4>Text Style</h4>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="text-styles-grid">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div 
                      key={index}
                      className="text-style-card"
                      onClick={() => {
                        setNewText('Title Here!');
                        setShowTextDialog(true);
                        setShowTextStylesView(false);
                      }}
                    >
                      <div className="text-style-preview">
                        <div className="title-text">Title Here!</div>
                        <div className="subtitle-text">Text Here!</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasUnsavedChanges && (
              <div className="unsaved-changes-notice">
                <i className="fas fa-exclamation-triangle"></i>
                You have unsaved changes
              </div>
            )}
          </aside>
        </div>

        {/* Add Text Dialog */}
        {showTextDialog && (
          <div className="overlay-dialog">
            <div className="dialog-backdrop" onClick={() => setShowTextDialog(false)}></div>
            <div className="dialog-content">
              <h3>Add Text</h3>
              <input
                type="text"
                placeholder="Enter your text..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="text-input"
                autoFocus
              />
              <div className="color-picker-section">
                <label>Text Color:</label>
                <input
                  type="color"
                  value={selectedTextColor}
                  onChange={(e) => setSelectedTextColor(e.target.value)}
                  className="color-picker"
                />
              </div>
              <div className="dialog-actions">
                <button onClick={() => setShowTextDialog(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleAddText} className="add-btn" disabled={!newText.trim()}>
                  Add Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Logo Dialog */}
        {showLogoDialog && (
          <div className="overlay-dialog">
            <div className="dialog-backdrop" onClick={() => setShowLogoDialog(false)}></div>
            <div className="dialog-content">
              <h3>Add Logo</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAddLogo(file);
                  }
                }}
                className="file-input"
              />
              <div className="dialog-actions">
                <button onClick={() => setShowLogoDialog(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdjustImagePage;