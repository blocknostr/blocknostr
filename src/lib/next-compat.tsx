
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Next.js router compatibility layer
export function useRouter() {
  const navigate = useNavigate();
  
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    pathname: window.location.pathname,
    query: Object.fromEntries(new URLSearchParams(window.location.search)),
  };
}

// Next.js Head compatibility component (simplified)
export function Head({ children }: { children: React.ReactNode }) {
  // This is a simplified version that just renders children
  // In a real implementation, you would use react-helmet or similar
  return <>{children}</>;
}

// Define a Next.js compatible Image component
export function Image({ 
  src, 
  alt, 
  width, 
  height,
  className,
  ...props 
}: { 
  src: string; 
  alt: string; 
  width?: number; 
  height?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      loading="lazy"
      {...props}
    />
  );
}

// Mock Next.js environment variables
if (typeof window !== 'undefined' && !window.process) {
  window.process = { 
    env: { 
      NODE_ENV: import.meta.env.MODE,
      NEXT_PUBLIC_DEFAULT_RELAYS: import.meta.env.VITE_DEFAULT_RELAYS || '',
      NEXT_PUBLIC_API_URL: import.meta.env.VITE_API_URL || '',
      NEXT_PUBLIC_ENVIRONMENT: import.meta.env.MODE,
    } 
  } as any;
}
