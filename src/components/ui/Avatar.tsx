import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  status,
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    away: 'bg-warning-500',
    busy: 'bg-error-500',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  // Handle relative URLs by prepending the backend URL and add cache-busting parameter
  const getImageUrl = (url: string) => {
    let finalUrl = url;

    if (url.startsWith('http')) {
      finalUrl = url; // Already a full URL
    } else if (url.startsWith('/')) {
      // Relative URL, prepend backend URL
      finalUrl = `http://localhost:5000${url}`;
    }

    // Add cache-busting parameter to prevent browser caching
    const separator = finalUrl.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${finalUrl}${separator}t=${timestamp}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={getImageUrl(src)}
        alt={alt}
        className={`rounded-full object-cover ${sizeClasses[size]}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=random`;
        }}
      />
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusColors[status]} ${statusSizes[size]}`}
        />
      )}
    </div>
  );
};