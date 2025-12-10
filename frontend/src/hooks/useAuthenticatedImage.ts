import { useState, useEffect } from 'react';

/**
 * Hook for loading images with authentication
 * @param imageUrl - The URL of the image to load
 * @returns Object containing blob URL, loading state, and error state
 */
export const useAuthenticatedImage = (imageUrl: string) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl('');
      setLoading(false);
      setError('');
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching image with auth:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load image');
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      // Clean up blob URL to prevent memory leaks
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageUrl]);

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return { blobUrl, loading, error };
};