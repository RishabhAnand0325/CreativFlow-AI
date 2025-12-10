/**
 * Utility functions for URL handling
 */

/**
 * Constructs a full URL from a potentially relative URL
 * @param url - The URL that might be relative or absolute
 * @returns Full URL with base URL prepended if needed
 */
export const getFullImageUrl = (url: string): string => {
  if (!url) {
    console.warn('getFullImageUrl: Empty URL provided');
    return '';
  }
  
  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('getFullImageUrl: Using absolute URL:', url);
    return url;
  }
  
  // If URL is relative, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Ensure no double slashes
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  const fullUrl = `${cleanBaseUrl}${cleanUrl}`;
  console.log('getFullImageUrl: Constructed full URL:', fullUrl, 'from relative URL:', url);
  return fullUrl;
};

/**
 * Handles image loading errors by showing a placeholder
 * @param event - The error event from the img element
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  console.warn('Failed to load image:', img.src);
  
  // Hide the image and show placeholder if available
  img.style.display = 'none';
  const placeholder = img.nextElementSibling as HTMLElement;
  if (placeholder && placeholder.classList.contains('image-placeholder')) {
    placeholder.style.display = 'flex';
  }
};