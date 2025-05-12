
'use client';

import React from 'react';
import * as NextNavigation from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Direct exports from Next.js
export const useRouter = NextNavigation.useRouter;
export const usePathname = NextNavigation.usePathname;
export const useSearchParams = NextNavigation.useSearchParams;

// Next.js router compatibility layer for old React Router code
export function useReactRouterCompat() {
  const router = NextNavigation.useRouter();
  const pathname = NextNavigation.usePathname();
  const searchParams = NextNavigation.useSearchParams();
  
  return {
    navigate: (url: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    location: {
      pathname,
      search: searchParams ? `?${searchParams.toString()}` : '',
    }
  };
}

// Define a compatibility version of useNavigate
export function useNavigate() {
  const router = NextNavigation.useRouter();
  return React.useCallback((url: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);
}

// For components that need useLocation functionality
export function useLocation() {
  const pathname = NextNavigation.usePathname();
  const searchParams = NextNavigation.useSearchParams();
  
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

// Export Next.js Image and Link components
export { Image, Link };

// Default export with all utilities
const NextCompat = {
  useRouter,
  usePathname,
  useSearchParams,
  useReactRouterCompat,
  useNavigate,
  useLocation,
  Image,
  Link
};

export default NextCompat;

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
