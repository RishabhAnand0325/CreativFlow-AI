import React from 'react';
import { useAuthenticatedImage } from '../hooks/useAuthenticatedImage';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: (error: string) => void;
  placeholder?: React.ReactNode;
}

/**
 * Component that loads images with authentication
 */
export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt,
  className,
  style,
  onError,
  placeholder
}) => {
  const { blobUrl, loading, error } = useAuthenticatedImage(src);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div className={className} style={style}>
        {placeholder || (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            color: '#666'
          }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        )}
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={className} style={style}>
        {placeholder || (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            color: '#666',
            padding: '1rem'
          }}>
            <i className="fas fa-image" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.6 }}></i>
            <span>Image not available</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      style={style}
    />
  );
};