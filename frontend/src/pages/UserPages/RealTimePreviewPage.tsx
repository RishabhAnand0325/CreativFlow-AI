import React, { useState, useEffect } from 'react';
import '../../App.css';
import './RealTimePreview.css';
import { generation } from '../../services/generation';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFullImageUrl } from '../../utils/url';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';

interface GeneratedAsset {
  id: string;
  originalAssetId: string;
  filename: string;
  assetUrl: string;
  platformName?: string;
  formatName: string;
  dimensions: {
    width: number;
    height: number;
  };
  isNsfw: boolean;
}

interface JobResults {
  [platformName: string]: GeneratedAsset[];
}

const RealTimePreviewPage: React.FC = () => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [resolution, setResolution] = useState(72);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId') || '';

  // Job status and results
  const [jobStatus, setJobStatus] = useState<string>('running');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobResults, setJobResults] = useState<JobResults>({});
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'resizing' | 'repurposing'>('resizing');
  const [groupBy, setGroupBy] = useState<'platform' | 'type' | 'original'>('platform');
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  // Batch download state
  const [showBatchDownload, setShowBatchDownload] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'JPEG' | 'PNG' | 'PSD'>('JPEG');
  const [imageQuality, setImageQuality] = useState<'High' | 'Medium' | 'Low'>('High');
  const [downloadOption, setDownloadOption] = useState<'Batch' | 'Individual' | 'Category'>('Individual');

  // Categorize assets based on platform type
  const categorizeAssets = () => {
    const resizingAssets: GeneratedAsset[] = [];
    const repurposingAssets: GeneratedAsset[] = [];

    Object.entries(jobResults).forEach(([platformName, assets]) => {
      // Categorize based on platform name
      if (['Mobile', 'Web', 'Desktop', 'Tablet'].includes(platformName)) {
        resizingAssets.push(...assets);
      } else {
        repurposingAssets.push(...assets);
      }
    });

    return { resizingAssets, repurposingAssets };
  };

  const { resizingAssets, repurposingAssets } = categorizeAssets();
  const currentAssets = activeTab === 'resizing' ? resizingAssets : repurposingAssets;

  // Group assets based on groupBy selection
  const groupAssets = (assets: GeneratedAsset[]) => {
    const grouped: { [key: string]: GeneratedAsset[] } = {};

    assets.forEach(asset => {
      let groupKey = '';
      
      if (groupBy === 'platform') {
        groupKey = asset.platformName || 'Other';
      } else if (groupBy === 'type') {
        // Extract file extension from filename or use formatName
        const extension = asset.filename.split('.').pop()?.toUpperCase() || 'Unknown';
        groupKey = extension;
      } else {
        // Group by original asset
        groupKey = asset.originalAssetId || 'Unknown';
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(asset);
    });

    return grouped;
  };

  const groupedAssets = groupAssets(currentAssets);

  // Poll for job status and results
  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pollTimeout: number;

    const pollJobStatus = async () => {
      try {
        const statusResponse = await generation.getJobStatus(jobId);

        if (cancelled) return;

        const status = statusResponse?.status || 'running';
        const progress = statusResponse?.progress || 0;

        setJobStatus(status);
        setJobProgress(progress);

        if (status === 'completed') {
          // Job completed, get results
          try {
            const results = await generation.getJobResults(jobId);
            console.log('Job results received:', results);
            if (!cancelled) {
              // Transform the results to match our interface
              const transformedResults: JobResults = {};
              Object.entries(results || {}).forEach(([platform, assets]) => {
                transformedResults[platform] = (assets as any[]).map((asset: any) => ({
                  id: asset.id,
                  originalAssetId: asset.originalAssetId,
                  filename: asset.filename,
                  assetUrl: asset.assetUrl,
                  platformName: asset.platformName,
                  formatName: asset.formatName,
                  dimensions: asset.dimensions,
                  isNsfw: asset.isNsfw || false
                }));
              });
              
              setJobResults(transformedResults);
              setLoading(false);
              
              // Set first asset as selected for preview
              const firstAsset = Object.values(transformedResults).flat()[0];
              if (firstAsset) {
                setSelectedAsset(firstAsset);
              }
              
              // Debug: Log asset URLs
              Object.values(transformedResults).flat().forEach((asset: GeneratedAsset) => {
                console.log('Asset:', asset.id, 'URL:', asset.assetUrl);
              });
            }
          } catch (resultsError) {
            console.error('Failed to get job results:', resultsError);
            setError('Failed to load generated assets');
            setLoading(false);
          }
        } else if (status === 'failed') {
          setError('Generation job failed');
          setLoading(false);
        } else {
          // Still running, continue polling
          pollTimeout = setTimeout(pollJobStatus, 2000);
        }
      } catch (statusError) {
        console.error('Failed to get job status:', statusError);
        if (!cancelled) {
          // Retry after longer delay on error
          pollTimeout = setTimeout(pollJobStatus, 5000);
        }
      }
    };

    setLoading(true);
    pollJobStatus();

    return () => {
      cancelled = true;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [jobId]);

  const handleAssetSelect = (id: string) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(assetId => assetId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === currentAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(currentAssets.map(asset => asset.id));
    }
  };

  const handleAssetClick = (asset: GeneratedAsset) => {
    setSelectedAsset(asset);
    // TODO: Fetch original asset details
  };

  const handlePreview = () => {
    navigate(`/preview?jobId=${jobId}`);
  };

  const handleBatchDownload = () => {
    setShowBatchDownload(true);
  };

  const handleDownloadExecute = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select assets to download');
      return;
    }

    try {
      // Map UI values to backend expected values
      const formatMap: { [key: string]: 'jpeg' | 'png' } = {
        'JPEG': 'jpeg',
        'PNG': 'png',
        'PSD': 'jpeg' // PSD not supported, fallback to JPEG
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

      // Create download request with correct format
      const downloadData = {
        assetIds: selectedAssets,
        format: formatMap[downloadFormat] || 'jpeg',
        quality: qualityMap[imageQuality] || 'high',
        grouping: groupingMap[downloadOption] || 'batch'
      };

      // Call download API
      const response = await generation.downloadAssets(downloadData);

      // Handle download response
      if (response.downloadUrl) {
        // Create a temporary link to trigger download
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

  const formatDimensions = (dimensions: { width: number; height: number }) => {
    return `${dimensions.width} × ${dimensions.height}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="preview-page-container">
        <header className="navbar">
          <div className="navbar-left">
            <div className="navbar-logo">
              <svg className="logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20 L80 80 M80 20 L20 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <span className="logo-text">AI CREAT</span>
            </div>
          </div>
          <div className="navbar-right">
            <button onClick={() => navigate('/user-dashboard')} className="icon-button">
              <i className="fas fa-home"></i>
            </button>
          </div>
        </header>
        <main className="preview-main-content">
          <div className="generation-status">
            <h2>Generating Your Assets...</h2>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${jobProgress}%` }}
              ></div>
            </div>
            <p>Status: {jobStatus} ({jobProgress}%)</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="preview-page-container">
        <header className="navbar">
          <div className="navbar-left">
            <div className="navbar-logo">
              <svg className="logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20 L80 80 M80 20 L20 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <span className="logo-text">AI CREAT</span>
            </div>
          </div>
          <div className="navbar-right">
            <button onClick={() => navigate('/user-dashboard')} className="icon-button">
              <i className="fas fa-home"></i>
            </button>
          </div>
        </header>
        <main className="preview-main-content">
          <div className="error-state">
            <h2>Generation Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/user-dashboard')} className="action-button primary">
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="preview-page-container" style={{ 
      minHeight: '100vh', 
      backgroundColor: '#2B3537', 
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navbar */}
      <header className="navbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid #404a53',
        backgroundColor: '#2B3537'
      }}>
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
        {/* Header with title and tabs */}
        <div className="preview-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: '1px solid #404a53'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: '#ffffff' }}>Real-Time AI Preview</h1>
          <div className="preview-tabs" style={{ display: 'flex', gap: '30px', marginLeft: '40px' }}>
            <button 
              className={`tab-button ${activeTab === 'resizing' ? 'active' : ''}`}
              onClick={() => setActiveTab('resizing')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'resizing' ? '#149ECA' : '#8A939C',
                fontSize: '16px',
                fontWeight: '500',
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: activeTab === 'resizing' ? '2px solid #149ECA' : '2px solid transparent'
              }}
            >
              Resizing
            </button>
            <button 
              className={`tab-button ${activeTab === 'repurposing' ? 'active' : ''}`}
              onClick={() => setActiveTab('repurposing')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'repurposing' ? '#149ECA' : '#8A939C',
                fontSize: '16px',
                fontWeight: '500',
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: activeTab === 'repurposing' ? '2px solid #149ECA' : '2px solid transparent'
              }}
            >
              Repurposing
            </button>
          </div>
          <div className="preview-actions" style={{ display: 'flex', gap: '15px' }}>
            <button 
              className="action-button-blue" 
              onClick={handlePreview}
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
              Preview
            </button>
            <button 
              className="action-button-blue"
              onClick={handleBatchDownload}
              disabled={selectedAssets.length === 0}
              style={{
                background: 'none',
                border: '1px solid #149ECA',
                color: selectedAssets.length === 0 ? '#666' : '#149ECA',
                padding: '10px 24px',
                borderRadius: '30px',
                cursor: selectedAssets.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '120px',
                opacity: selectedAssets.length === 0 ? '0.5' : '1'
              }}
            >
              Batch Download
            </button>
          </div>
        </div>

        <div className="preview-body" style={{ display: 'flex', flex: '1', height: 'calc(100vh - 140px)' }}>
          {/* Left Section - Generated Assets */}
          <div className="generated-assets-section" style={{
            flex: '1',
            padding: '24px',
            borderRight: '1px solid #404a53',
            backgroundColor: '#2B3537',
            height: '100%'
          }}>
            <div className="assets-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #404a53'
            }}>
              <div className="assets-title-section" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0', color: '#ffffff' }}>Generated Assets</h2>
                <label className="select-all-checkbox" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#e0e0e0'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedAssets.length === currentAssets.length && currentAssets.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span className="checkmark"></span>
                  Select All
                </label>
              </div>
              <div className="group-by-dropdown" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#8A939C'
              }}>
                <label>Group by</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'platform' | 'type' | 'original')}
                  className="dropdown-select"
                  style={{
                    backgroundColor: '#404a53',
                    border: '1px solid #5a6268',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="platform">Platform</option>
                  <option value="type">Type</option>
                  <option value="original">Original Asset</option>
                </select>
              </div>
            </div>

            {/* Assets Grid */}
            <div className="assets-container" style={{ height: 'calc(100% - 80px)', overflowY: 'auto' }}>
              {currentAssets.length === 0 ? (
                <div className="empty-state" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '300px',
                  color: '#8A939C',
                  fontSize: '16px'
                }}>
                  <p>No {activeTab} assets generated yet.</p>
                </div>
              ) : (
                <div className="assets-categories" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.entries(groupedAssets).map(([categoryName, assets]) => (
                    <div key={categoryName} className="asset-category" style={{
                      backgroundColor: '#404a53',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #5a6268'
                    }}>
                      <div className="category-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #5a6268'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: '0',
                          color: '#ffffff'
                        }}>
                          {categoryName} ({assets.length} {assets.length === 1 ? 'file' : 'files'})
                        </h3>
                        <label className="category-select-all" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#8A939C'
                        }}>
                          <input
                            type="checkbox"
                            checked={assets.every(asset => selectedAssets.includes(asset.id))}
                            onChange={() => {
                              const categoryAssetIds = assets.map(asset => asset.id);
                              const allSelected = categoryAssetIds.every(id => selectedAssets.includes(id));
                              
                              if (allSelected) {
                                setSelectedAssets(prev => prev.filter(id => !categoryAssetIds.includes(id)));
                              } else {
                                setSelectedAssets(prev => [...new Set([...prev, ...categoryAssetIds])]);
                              }
                            }}
                            style={{ width: '14px', height: '14px', accentColor: '#149ECA' }}
                          />
                          Select All
                        </label>
                      </div>
                      
                      <div className="assets-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        {assets.map(asset => (
                    <div
                      key={asset.id}
                      className={`asset-item ${selectedAssets.includes(asset.id) ? 'selected' : ''}`}
                      onClick={() => handleAssetClick(asset)}
                      style={{
                        backgroundColor: selectedAssets.includes(asset.id) ? 'rgba(20, 158, 202, 0.1)' : '#2B3537',
                        border: selectedAssets.includes(asset.id) ? '2px solid #149ECA' : '2px solid transparent',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div className="asset-header">
                        <label className="asset-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => handleAssetSelect(asset.id)}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <span className="asset-filename">{asset.filename}</span>
                      </div>
                      
                      {!asset.isNsfw ? (
                        <div className="asset-image-container">
                          <AuthenticatedImage
                            src={getFullImageUrl(asset.assetUrl)}
                            alt={asset.formatName}
                            className="asset-image"
                            placeholder={
                              <div className="image-placeholder">
                                <i className="fas fa-image"></i>
                              </div>
                            }
                          />
                        </div>
                      ) : (
                        <div className="nsfw-content">
                          <i className="fas fa-eye-slash"></i>
                          <p>NSFW Content!</p>
                          <p>Flagged Content Alerts</p>
                          <button className="show-button">Show</button>
                        </div>
                      )}
                      
                      <div className="asset-info">
                        <div className="asset-details">
                          <span className="asset-format">{asset.formatName}</span>
                          <span className="asset-dimensions">({formatDimensions(asset.dimensions)})</span>
                        </div>
                        <button
                          className="edit-more-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/adjust-image?assetId=${asset.id}`);
                          }}
                          title="Edit and adjust this image"
                          
                        >
                          <i className="fas fa-edit" style={{ fontSize: '10px' }}></i> Edit More
                        </button>
                      </div>
                    </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Image Comparison */}
          <div className="image-comparison-section" style={{
            width: '380px',
            padding: '24px',
            backgroundColor: '#2B3537',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0', color: '#ffffff' }}>Adjust Resolution</h3>
            
            <div className="comparison-container">
              <div className="image-preview">
                <label>New</label>
                <div className="preview-image">
                  {selectedAsset ? (
                    <AuthenticatedImage
                      src={getFullImageUrl(selectedAsset.assetUrl)}
                      alt="New version"
                      className="comparison-image"
                      placeholder={
                        <div className="image-placeholder">
                          <i className="fas fa-image"></i>
                        </div>
                      }
                    />
                  ) : (
                    <div className="image-placeholder">
                      <i className="fas fa-image"></i>
                      <span>Select an asset to preview</span>
                    </div>
                  )}
                </div>
                {selectedAsset && (
                  <div className="image-dimensions">
                    {formatDimensions(selectedAsset.dimensions)}
                  </div>
                )}
              </div>

              <div className="image-preview">
                <label>Original</label>
                <div className="preview-image">
                  <div className="image-placeholder">
                    <i className="fas fa-image"></i>
                    <span>Original image</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="resolution-controls">
              <h4>Scroll to Adjust</h4>
              <div className="slider-control">
                <label>Resolution</label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="30"
                    max="600"
                    value={resolution}
                    onChange={(e) => setResolution(Number(e.target.value))}
                    className="resolution-slider"
                  />
                  <span className="slider-value">{resolution} DPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    Download All generated Versions ({selectedAssets.length})
                  </p>
                </div>

                <button
                  className="download-button"
                  onClick={handleDownloadExecute}
                  disabled={selectedAssets.length === 0}
                  style={{
                    width: '100%',
                    backgroundColor: selectedAssets.length === 0 ? '#666' : '#149ECA',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: selectedAssets.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedAssets.length === 0 ? '0.5' : '1',
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

export default RealTimePreviewPage;