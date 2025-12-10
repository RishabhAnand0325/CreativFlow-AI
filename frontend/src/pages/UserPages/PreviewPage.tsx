import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generation } from '../../services/generation';
import { getFullImageUrl } from '../../utils/url';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import type { JobResults, GeneratedAsset } from '../../types';
import '../../App.css';

const PreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId') || '';

  const [jobResults, setJobResults] = useState<JobResults>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showBatchDownload, setShowBatchDownload] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [downloadFormat, setDownloadFormat] = useState<'JPEG' | 'PNG' | 'PSD'>('JPEG');
  const [imageQuality, setImageQuality] = useState<'High' | 'Medium' | 'Low'>('High');
  const [downloadOption, setDownloadOption] = useState<'Batch' | 'Individual' | 'Category'>('Individual');

  // Fetch job results
  useEffect(() => {
    const fetchResults = async () => {
      if (!jobId) {
        setError('No job ID provided');
        setLoading(false);
        return;
      }

      try {
        const results = await generation.getJobResults(jobId);
        setJobResults(results || {});
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Failed to load generated assets');
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  // Categorize assets
  const categorizeAssets = () => {
    const resizingAssets: GeneratedAsset[] = [];
    const repurposingAssets: GeneratedAsset[] = [];

    Object.entries(jobResults).forEach(([platformName, assets]) => {
      if (['Mobile', 'Web', 'Desktop', 'Tablet'].includes(platformName)) {
        resizingAssets.push(...assets);
      } else {
        repurposingAssets.push(...assets);
      }
    });

    return { resizingAssets, repurposingAssets };
  };

  const { resizingAssets, repurposingAssets } = categorizeAssets();

  const formatDimensions = (dimensions: { width: number; height: number }) => {
    return `${dimensions.width} × ${dimensions.height}`;
  };

  const handleDownloadExecute = async () => {
    // Get all assets if none selected
    const allAssets = Object.values(jobResults).flat();
    const assetsToDownload = selectedAssets.length > 0 ? selectedAssets : allAssets.map(asset => asset.id);

    if (assetsToDownload.length === 0) {
      alert('No assets to download');
      return;
    }

    try {
      const formatMap: { [key: string]: 'jpeg' | 'png' } = {
        'JPEG': 'jpeg',
        'PNG': 'png',
        'PSD': 'jpeg'
      };

      const qualityMap: { [key: string]: 'high' | 'medium' | 'low' } = {
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low'
      };

      const groupingMap: { [key: string]: 'individual' | 'batch' | 'category' } = {
        'Individual': 'individual',
        'Batch': 'batch',
        'Category': 'category'
      };

      const downloadData = {
        assetIds: assetsToDownload,
        format: formatMap[downloadFormat] || 'jpeg',
        quality: qualityMap[imageQuality] || 'high',
        grouping: groupingMap[downloadOption] || 'batch'
      };

      const response = await generation.downloadAssets(downloadData);

      if (response.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = `assets_${downloadOption.toLowerCase()}_${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setShowBatchDownload(false);
    } catch (error: any) {
      console.error('Download failed:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Download failed. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="preview-page-container">
        <header className="navbar">
          <div className="navbar-left">
            <button onClick={() => navigate(-1)} className="back-button">
              <i className="fas fa-arrow-left"></i>
              Preview
            </button>
            <span className="preview-subtitle">Preview showing 7 file detected elements that have been resized and repurposed.</span>
          </div>
          <div className="navbar-right">
            <button className="action-button-blue">Batch Download</button>
          </div>
        </header>
        <div className="loading-state">
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-page-container">
        <header className="navbar">
          <div className="navbar-left">
            <button onClick={() => navigate(-1)} className="back-button">
              <i className="fas fa-arrow-left"></i>
              Preview
            </button>
          </div>
        </header>
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-page-container">
      {/* Navbar */}
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
          <button className="icon-button">
            <i className="fas fa-sun"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-bell"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-cog"></i>
          </button>
          <div className="user-profile">
            <img
              src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80"
              alt="User"
              className="profile-avatar"
            />
          </div>
        </div>
      </header>

      <main className="preview-main-content">
        {/* Header */}
        <div className="preview-page-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: '1px solid #404a53',
          backgroundColor: '#2B3537'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} className="back-button" style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0'
            }}>
              <i className="fas fa-arrow-left"></i>
              Preview
            </button>
            <span className="preview-subtitle" style={{
              color: '#8A939C',
              fontSize: '14px',
              marginLeft: '20px'
            }}>
              Preview showing {Object.values(jobResults).flat().length} file detected elements that have been resized and repurposed.
            </span>
          </div>
          <button
            className="action-button-blue"
            onClick={() => setShowBatchDownload(true)}
            style={{
              background: 'none',
              border: '1px solid #149ECA',
              color: '#149ECA',
              padding: '10px 24px',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '120px'
            }}
          >
            Batch Download
          </button>
        </div>

        {/* Resizing Section */}
        {resizingAssets.length > 0 && (
          <div className="preview-section" style={{
            padding: '24px 40px',
            borderBottom: '1px solid #404a53'
          }}>
            <div className="section-container" style={{
              backgroundColor: '#404a53',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #5a6268'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 20px 0',
                color: '#ffffff',
                paddingBottom: '16px',
                borderBottom: '1px solid #5a6268'
              }}>
                Resizing ({resizingAssets.length} {resizingAssets.length === 1 ? 'file' : 'files'})
              </h2>
              <div className="assets-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {resizingAssets.map(asset => (
                  <div key={asset.id} className="preview-asset-item" style={{
                    backgroundColor: '#2B3537',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid #5a6268'
                  }}>
                    <div className="asset-header" style={{
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #5a6268'
                    }}>
                      <span className="asset-filename" style={{
                        fontSize: '12px',
                        color: '#e0e0e0',
                        fontWeight: '500'
                      }}>{asset.filename}</span>
                    </div>
                    <div className="asset-image-container" style={{
                      width: '100%',
                      height: '120px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      overflow: 'hidden'
                    }}>
                      {!asset.is_nsfw ? (
                        <AuthenticatedImage
                          src={getFullImageUrl(asset.assetUrl)}
                          alt={asset.formatName}
                          className="preview-asset-image"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                          placeholder={
                            <div className="image-placeholder" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              color: '#8A939C'
                            }}>
                              <i className="fas fa-image" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                              <span style={{ fontSize: '12px' }}>Loading...</span>
                            </div>
                          }
                        />
                      ) : (
                        <div className="nsfw-placeholder" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#8A939C'
                        }}>
                          <i className="fas fa-eye-slash" style={{ fontSize: '24px', marginBottom: '8px', color: '#ff6b6b' }}></i>
                          <p style={{ margin: '0', fontSize: '12px' }}>NSFW Content</p>
                        </div>
                      )}
                    </div>
                    <div className="asset-info" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px'
                    }}>
                      <span className="asset-format" style={{ color: '#e0e0e0', fontWeight: '500' }}>{asset.formatName}</span>
                      <span className="asset-dimensions" style={{ color: '#8A939C' }}>{formatDimensions(asset.dimensions)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Repurposing Section */}
        {repurposingAssets.length > 0 && (
          <div className="preview-section" style={{
            padding: '24px 40px',
            borderBottom: '1px solid #404a53'
          }}>
            <div className="section-container" style={{
              backgroundColor: '#404a53',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #5a6268'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 20px 0',
                color: '#ffffff',
                paddingBottom: '16px',
                borderBottom: '1px solid #5a6268'
              }}>
                Repurposing ({repurposingAssets.length} {repurposingAssets.length === 1 ? 'file' : 'files'})
              </h2>
              <div className="assets-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {repurposingAssets.map(asset => (
                  <div key={asset.id} className="preview-asset-item" style={{
                    backgroundColor: '#2B3537',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid #5a6268'
                  }}>
                    <div className="asset-header" style={{
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #5a6268'
                    }}>
                      <span className="asset-filename" style={{
                        fontSize: '12px',
                        color: '#e0e0e0',
                        fontWeight: '500'
                      }}>{asset.filename}</span>
                    </div>
                    <div className="asset-image-container" style={{
                      width: '100%',
                      height: '120px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      overflow: 'hidden'
                    }}>
                      {!asset.is_nsfw ? (
                        <AuthenticatedImage
                          src={getFullImageUrl(asset.assetUrl)}
                          alt={asset.formatName}
                          className="preview-asset-image"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                          placeholder={
                            <div className="image-placeholder" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              color: '#8A939C'
                            }}>
                              <i className="fas fa-image" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                              <span style={{ fontSize: '12px' }}>Loading...</span>
                            </div>
                          }
                        />
                      ) : (
                        <div className="nsfw-placeholder" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#8A939C'
                        }}>
                          <i className="fas fa-eye-slash" style={{ fontSize: '24px', marginBottom: '8px', color: '#ff6b6b' }}></i>
                          <p style={{ margin: '0', fontSize: '12px' }}>NSFW Content</p>
                        </div>
                      )}
                    </div>
                    <div className="asset-info" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px'
                    }}>
                      <span className="asset-format" style={{ color: '#e0e0e0', fontWeight: '500' }}>{asset.formatName}</span>
                      <span className="asset-dimensions" style={{ color: '#8A939C' }}>{formatDimensions(asset.dimensions)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {resizingAssets.length === 0 && repurposingAssets.length === 0 && (
          <div className="empty-state" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: '#8A939C',
            fontSize: '16px'
          }}>
            <p>No assets available for preview.</p>
          </div>
        )}

        {/* Batch Download Sidebar */}
        {showBatchDownload && (
          <div className="batch-download-modal" style={{
            position: 'fixed',
            top: '0',
            right: '0',
            bottom: '0',
            zIndex: '1000',
            display: 'flex'
          }}>
            <div className="batch-download-overlay" onClick={() => setShowBatchDownload(false)} style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '400px',
              bottom: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}></div>
            <div className="batch-download-sidebar" style={{
              width: '400px',
              backgroundColor: '#404a53',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              zIndex: '1001',
              height: '100vh'
            }}>
              <div className="batch-download-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #5a6268'
              }}>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>Batch Download</h3>
                <button
                  className="close-button"
                  onClick={() => setShowBatchDownload(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8A939C',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="batch-download-content" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div className="download-section" style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0', marginBottom: '12px' }}>File Formats</h4>
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value as 'JPEG' | 'PNG' | 'PSD')}
                    style={{
                      width: '100%',
                      backgroundColor: '#2B3537',
                      border: '1px solid #5a6268',
                      color: '#ffffff',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="JPEG">JPEG</option>
                    <option value="PNG">PNG</option>
                    <option value="PSD">PSD</option>
                  </select>
                </div>

                <div className="download-section" style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0', marginBottom: '12px' }}>Image Quality (PPI)</h4>
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as 'High' | 'Medium' | 'Low')}
                    style={{
                      width: '100%',
                      backgroundColor: '#2B3537',
                      border: '1px solid #5a6268',
                      color: '#ffffff',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="download-section" style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0', marginBottom: '12px' }}>Download Options</h4>
                  <select
                    value={downloadOption}
                    onChange={(e) => setDownloadOption(e.target.value as 'Batch' | 'Individual' | 'Category')}
                    style={{
                      width: '100%',
                      backgroundColor: '#2B3537',
                      border: '1px solid #5a6268',
                      color: '#ffffff',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="Individual">Individual</option>
                    <option value="Batch">Batch</option>
                    <option value="Category">Category</option>
                  </select>
                </div>

                <div className="download-summary" style={{
                  backgroundColor: '#2B3537',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #5a6268'
                }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#e0e0e0' }}>
                    Download All generated Versions ({Object.values(jobResults).flat().length})
                  </p>
                </div>

                <button
                  className="download-button"
                  onClick={handleDownloadExecute}
                  style={{
                    width: '100%',
                    backgroundColor: '#149ECA',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginTop: 'auto'
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PreviewPage;