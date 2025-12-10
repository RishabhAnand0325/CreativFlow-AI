import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generation } from '../services/generation';
import type { GeneratedAsset } from '../types';

export const useAssetLoader = () => {
  const navigate = useNavigate();
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const loadAssetData = useCallback(async (assetId: string | null, jobId: string | null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!assetId && !jobId) {
      setError('No asset or job ID provided');
      return;
    }

    let isMounted = true;

    try {
      setError('');

      if (assetId) {
        // Load specific asset directly using the service
        console.log('Loading asset with ID:', assetId);
        const asset = await generation.getGeneratedAsset(assetId);
        if (isMounted && asset) {
          setCurrentAsset(asset);
          setCurrentIndex(0);
          setTotalAssets(1);
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

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return {
    currentAsset,
    currentIndex,
    totalAssets,
    error,
    loadAssetData,
    setCurrentAsset,
    setCurrentIndex,
    setTotalAssets,
    setError,
  };
};