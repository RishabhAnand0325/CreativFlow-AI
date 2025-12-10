import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboard } from '../../services/dashboard';
import type { Project, Asset, AssetMetadata } from '../../types';

interface PreviewFile {
  id: string;
  name: string;
  detected: string[];
  layers: string;
  dimensions: string;
  dpi: string;
  previewUrl?: string;
}

interface AIPreviewSectionProps {
  projects?: Project[];
  onRefresh?: () => void;
}

const AIPreviewSection: React.FC<AIPreviewSectionProps> = ({
  projects = [],
  onRefresh
}) => {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Helper function to get image dimensions
  const getImageDimensions = (url: string): Promise<{ width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  };

  // Extract detected elements helper function
  const extractDetectedElements = (metadata: any): string[] => {
    if (!metadata || typeof metadata !== 'object') return ['Processing...'];

    const detected: string[] = [];

    // Check for boolean flags
    if (metadata.hasProduct) detected.push('Product');
    if (metadata.hasText) detected.push('Text');
    if (metadata.hasTagline) detected.push('Tagline');
    if (metadata.hasLogo) detected.push('Logo');

    // Check detected_elements array if available
    if (metadata.detected_elements && Array.isArray(metadata.detected_elements)) {
      metadata.detected_elements.forEach((element: any) => {
        if (element && element.type && !detected.includes(element.type)) {
          detected.push(element.type);
        }
      });
    }

    // Check for other common metadata fields
    if (metadata.objects && Array.isArray(metadata.objects)) {
      metadata.objects.forEach((obj: any) => {
        if (obj && obj.name && !detected.includes(obj.name)) {
          detected.push(obj.name);
        }
      });
    }

    // If we have any metadata but no specific detected elements, show analysis complete
    if (detected.length === 0 && Object.keys(metadata).length > 0) {
      return ['Analysis Complete'];
    }

    return detected.length > 0 ? detected : ['Processing...'];
  };

  // Load preview data function
  const loadPreviewData = async (projectId: string) => {
    try {
      setLoading(true);
      setError('');

      const previewAssets = await dashboard.getProjectPreview(projectId);

      console.log('Raw API response:', previewAssets); // Debug log

      const formattedData: PreviewFile[] = await Promise.all(
        previewAssets.map(async (asset: any) => {
          // The API returns: { id, filename, previewUrl, metadata }
          const metadata = asset.metadata || {};

          console.log(`Asset ${asset.filename} metadata:`, metadata); // Debug log

          // Try to get dimensions from the image itself
          let dimensions = 'Unknown';
          if (asset.previewUrl) {
            try {
              const imageUrl = asset.previewUrl.startsWith('http')
                ? asset.previewUrl
                : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${asset.previewUrl}`;

              const imageDimensions = await getImageDimensions(imageUrl);
              if (imageDimensions) {
                dimensions = `${imageDimensions.width}x${imageDimensions.height}`;
              }
            } catch (error) {
              console.log(`Could not get dimensions for ${asset.filename}:`, error);
            }
          }

          // Check if dimensions are in metadata
          if (dimensions === 'Unknown' && metadata.dimensions) {
            if (typeof metadata.dimensions === 'string') {
              dimensions = metadata.dimensions;
            } else if (metadata.dimensions.width && metadata.dimensions.height) {
              dimensions = `${metadata.dimensions.width}x${metadata.dimensions.height}`;
            }
          }

          return {
            id: asset.id,
            name: asset.filename || 'Unknown file',
            detected: extractDetectedElements(metadata),
            layers: metadata.layers || '1 Layer',
            dimensions: dimensions,
            dpi: metadata.dpi ? `${metadata.dpi}DPI` : '300DPI',
            previewUrl: asset.previewUrl
          };
        })
      );

      console.log('Formatted data:', formattedData); // Debug log
      setPreviewData(formattedData);
    } catch (error: any) {
      console.error('Failed to load preview data:', error);
      setError(error.message || 'Failed to load AI preview data');
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResizeRepurpose = () => {
    if (projects.length > 0) {
      navigate(`/multi-select?projectId=${projects[0].id}`);
    } else {
      navigate('/multi-select');
    }
  };

  const handleRefresh = () => {
    if (projects.length > 0) {
      loadPreviewData(projects[0].id);
    }
    onRefresh?.();
  };

  // Effect to load preview data when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadPreviewData(projects[0].id);
    } else {
      setPreviewData([]);
      setError('');
    }
  }, [projects.length > 0 ? projects[0]?.id : null]); // Only re-run when the first project ID changes

  const files = previewData;

  if (loading) {
    return (
      <div className="ai-preview-section">
        <div className="ai-preview-header">
          <h2 className="ai-preview-title">AI Preview</h2>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading AI analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="ai-preview-section">
        <div className="ai-preview-header">
          <h2 className="ai-preview-title">AI Preview</h2>
          <p className="ai-preview-description">
            Upload files to see AI analysis and preview detected elements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-preview-section">
      <div className="ai-preview-header">
        <div>
          <h2 className="ai-preview-title">AI Preview</h2>
          <p className="ai-preview-description">
            AI analysis preview showing {files.length} file{files.length !== 1 ? 's' : ''} with detected elements ready to be resized and repurposed.
          </p>
        </div>
        <button
          className="resize-repurpose-button"
          onClick={handleResizeRepurpose}
          disabled={files.length === 0}
        >
          Resize & Repurposing
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <div className="preview-content-area">
        <h3 className="preview-label">
          Preview <span className="file-count">({files.length} file{files.length !== 1 ? 's' : ''} detected)</span>
        </h3>

        <div className="file-preview-grid">
          {files.length === 0 ? (
            <div className="no-preview-data">
              <i className="fas fa-inbox"></i>
              <p>No preview data available. Files may still be processing.</p>
              <button onClick={handleRefresh} className="refresh-button">
                <i className="fas fa-redo"></i> Refresh
              </button>
            </div>
          ) : (
            files.map((file: PreviewFile, index: number) => (
              <div className="file-card" key={file.id || index}>
                <p className="file-name">{file.name}</p>
                <div className="file-thumbnail">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl.startsWith('http')
                        ? file.previewUrl
                        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${file.previewUrl}`
                      }
                      alt={file.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="thumbnail-placeholder"
                    style={{ display: file.previewUrl ? 'none' : 'flex' }}
                  >
                    {(() => {
                      const extension = file.name.split('.').pop()?.toLowerCase();
                      if (extension === 'psd') {
                        return <i className="fas fa-layer-group"></i>;
                      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                        return <i className="fas fa-image"></i>;
                      } else {
                        return <i className="fas fa-file"></i>;
                      }
                    })()}
                    <span className="file-type-text">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                  </div>
                </div>
                <div className="file-details">
                  {file.detected.map((item: string, i: number) => (
                    <p key={i} className="detected-item">
                      <i className="fas fa-check-circle check-icon"></i> {item}
                    </p>
                  ))}
                  <p className="file-info">
                    {file.layers} &bull; {file.dimensions} &bull; {file.dpi}
                  </p>
                  <button
                    className="edit-more-button"
                    onClick={() => navigate(`/adjust-image?assetId=${file.id}`)}
                    title="Edit and adjust this image"
                  >
                    <i className="fas fa-edit"></i> Edit More
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPreviewSection;