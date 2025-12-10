import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../App.css';
import RepurposingGrid from './RepurposingGrid';
import { generation } from '../../services/generation';
import { dashboard } from '../../services/dashboard';
import { auth } from '../../services/auth';

// Import types from central location
import type { AssetFormat, FormatsResponse } from '../../types';

interface ProvidersResponse {
  providers: string[];
}

interface Project {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

interface TemplateItem {
  id: string;
  name: string;
  dimensions: string;
  ratio: string;
  iconRatio: string;
  width: number;
  height: number;
}

interface TemplateCategory {
  category: string;
  items: TemplateItem[];
}

const MultiChannelSelectionPage: React.FC = () => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'resizing' | 'repurposing'>('resizing');
  const [templateData, setTemplateData] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [customUnit, setCustomUnit] = useState('pixels');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  // Load data on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadPageData();
  }, [navigate]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      const [formatsData, providersData, projectsData] = await Promise.all([
        generation.getFormats() as Promise<FormatsResponse>,
        generation.getProviders() as Promise<ProvidersResponse>,
        dashboard.getProjects() as Promise<Project[]>
      ]);

      // Transform formats data to match template structure
      const transformedData = transformFormatsToTemplates(formatsData.resizing || []);
      setTemplateData(transformedData);
      setProviders(providersData.providers || ['gemini']);
      setProjects(projectsData || []);

      // Set selected project from URL or use most recent
      if (projectId && projectsData) {
        const project = projectsData.find((p: Project) => p.id === projectId);
        setSelectedProject(project || null);
      } else if (projectsData && projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }

    } catch (error) {
      console.error('Failed to load page data:', error);
      setError('Failed to load templates and projects');
    } finally {
      setLoading(false);
    }
  };

  // Transform backend formats to frontend template structure
  const transformFormatsToTemplates = (formats: AssetFormat[]): TemplateCategory[] => {
    const grouped = formats.reduce((acc: Record<string, TemplateItem[]>, format: AssetFormat) => {
      const category = format.platformName || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }

      const ratio = calculateAspectRatio(format.width, format.height);
      const iconRatio = getIconRatio(format.width, format.height);

      acc[category].push({
        id: format.id,
        name: format.name,
        dimensions: `${format.width}x${format.height}`,
        ratio: ratio,
        iconRatio: iconRatio,
        width: format.width,
        height: format.height
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items
    }));
  };

  const calculateAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  const getIconRatio = (width: number, height: number): string => {
    const ratio = width / height;
    if (ratio > 1.5) return 'wide';
    if (ratio < 0.7) return 'tall';
    if (ratio > 0.9 && ratio < 1.1) return 'square';
    if (ratio < 0.5) return 'skyscraper';
    return 'medium';
  };

  const allTemplateIds = templateData.flatMap(cat => cat.items.map(item => item.id));

  const handleCheckboxChange = (id: string) => {
    setSelectedTemplates(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === allTemplateIds.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(allTemplateIds);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const handleGenerateWithAI = async () => {
    console.log('=== GENERATE WITH AI CLICKED ===');
    console.log('Selected project:', selectedProject);
    console.log('Selected templates:', selectedTemplates);
    console.log('Custom dimensions:', { width: customWidth, height: customHeight });
    console.log('Selected provider:', selectedProvider);

    if (!selectedProject) {
      console.log('ERROR: No project selected');
      setError('Please select a project first');
      return;
    }

    if (selectedTemplates.length === 0 && (customWidth === 0 || customHeight === 0)) {
      console.log('ERROR: No templates or custom dimensions');
      setError('Please select at least one template or specify custom dimensions');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const customResizes = [];
      if (customWidth > 0 && customHeight > 0) {
        customResizes.push({ width: customWidth, height: customHeight });
      }

      const generationRequest = {
        projectId: selectedProject.id,
        formatIds: selectedTemplates,
        customResizes: customResizes,
        provider: selectedProvider
      };

      console.log('Generation request:', generationRequest);
      console.log('Calling generation.startGeneration...');

      const result = await generation.startGeneration(generationRequest);
      console.log('Generation result:', result);

      console.log('Navigating to:', `/real-time-prev?jobId=${result.jobId}`);
      navigate(`/real-time-prev?jobId=${result.jobId}`);

    } catch (error: any) {
      console.error('=== GENERATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Generation failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="selection-page-container">
        <div className="loading-message">Loading templates and projects...</div>
      </div>
    );
  }

  return (
    <div className="selection-page-container">
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

      <main className="selection-main-content">
        {/* Top Header */}
        <div className="selection-header">
          <div>
            <h1>Multi-channel Selection</h1>
            {selectedProject && (
              <p className="selected-project">
                Project: <strong>{selectedProject.name || `Project ${selectedProject.id.slice(-4)}`}</strong>
              </p>
            )}
          </div>
          <div className="header-controls">
            {projects.length > 1 && (
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  setSelectedProject(project || null);
                }}
                className="project-selector"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name || `Project ${project.id.slice(-4)}`}
                  </option>
                ))}
              </select>
            )}
            <button
              className="generate-ai-button"
              onClick={handleGenerateWithAI}
              disabled={generating || !selectedProject}
            >
              <i className="fas fa-plus"></i>
              {generating ? 'Generating...' : 'Generate With AI'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="selection-tabs">
          <button
            className={`tab-item ${activeTab === 'resizing' ? 'active' : ''}`}
            onClick={() => setActiveTab('resizing')}
          >
            Resizing
          </button>
          <button
            className={`tab-item ${activeTab === 'repurposing' ? 'active' : ''}`}
            onClick={() => setActiveTab('repurposing')}
          >
            Repurposing
          </button>
        </div>

        {/* Main Content */}
        {activeTab === 'resizing' ? (
          <div className="selection-columns">
            {/* Left Column: Templates */}
            <div className="template-column">
              <div className="column-header">
                <h3>Templates ({selectedTemplates.length} selected)</h3>
                <button onClick={handleSelectAll} className="select-all-button">
                  {selectedTemplates.length === allTemplateIds.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="template-list">
                {templateData.length === 0 ? (
                  <div className="no-templates">No templates available</div>
                ) : (
                  templateData.map(category => (
                    <div key={category.category} className="template-category">
                      <h4>{category.category}</h4>
                      {category.items.map(item => (
                        <label key={item.id} className="template-item">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.includes(item.id)}
                            onChange={() => handleCheckboxChange(item.id)}
                          />
                          <span className="custom-checkbox"></span>
                          <div className="template-details">
                            <span className="template-name">{item.name}</span>
                            <span className="template-dims">{item.dimensions}</span>
                          </div>
                          <div className="aspect-ratio">
                            <div className={`aspect-ratio-icon ratio-${item.iconRatio}`}></div>
                            <span>{item.ratio}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Custom */}
            <div className="custom-column">
              <div className="column-header">
                <h3>Custom Dimensions</h3>
              </div>
              <div className="custom-form">
                <div className="form-group">
                  <label>Sizes</label>
                  <div className="dimension-inputs">
                    <div className="input-wrapper">
                      <span>W</span>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="input-wrapper">
                      <span>H</span>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="unit-select">Unit</label>
                  <div className="select-wrapper">
                    <select
                      id="unit-select"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                    >
                      <option value="pixels">Pixels</option>
                      <option value="inches">Inches</option>
                      <option value="cm">Centimeters</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="provider-select">AI Provider</label>
                  <div className="select-wrapper">
                    <select
                      id="provider-select"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                      {providers.map(provider => (
                        <option key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <RepurposingGrid
            onSelectionChange={(selectedFormatIds) => {
              setSelectedTemplates(selectedFormatIds);
            }}
            initialSelection={selectedTemplates}
          />
        )}
      </main>
    </div>
  );
};

export default MultiChannelSelectionPage;
