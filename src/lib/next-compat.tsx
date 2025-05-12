
'use client';

import React from 'react';
import { useRouter, usePathname as nextUsePathname, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Next.js router compatibility layer for old React Router code
export function useReactRouterCompat() {
  const nextRouter = useRouter();
  const pathname = nextUsePathname();
  const searchParams = nextUseSearchParams();
  
  return {
    navigate: (url: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        nextRouter.replace(url);
      } else {
        nextRouter.push(url);
      }
    },
    location: {
      pathname,
      search: searchParams ? `?${searchParams.toString()}` : '',
    }
  };
}

// Export Next.js navigation hooks directly
export { useRouter };
export const usePathname = nextUsePathname;
export const useSearchParams = nextUseSearchParams;

// Define a compatibility version of useNavigate
export function useNavigate() {
  const router = useRouter();
  return (url: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  };
}

// Export Next.js Image and Link components
export { Image, Link };

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
