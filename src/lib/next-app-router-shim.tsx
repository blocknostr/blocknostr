
'use client';

// This file provides compatibility shims between Next.js App Router and old React Router usage
// for the transition period while migrating

import React from 'react';
import { usePathname as nextUsePathname, useRouter, useSearchParams as nextUseSearchParams } from 'next/navigation';
import Link from 'next/link';

// Export Next.js App Router functionality with standard names
// Rename imports to avoid circular reference
export const usePathname = nextUsePathname;
export const useSearchParams = nextUseSearchParams;

// Compatibility: create a useParams hook that returns params from React Router format
export function useParams() {
  // In Next.js App Router, params are passed as props to page components
  // This is just a stub for transition purposes
  return {};
}

// Export Next.js Router with exact API match for useRouter()
export { useRouter };

// Next.js Link component is already properly exported

// Compatibility for React Router's Navigate component
export function Navigate({ to, replace }: { to: string, replace?: boolean }) {
  const router = useRouter();
  
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  
  return null;
}

// Mock metadata helper for App Router
export function generateMetadata({ title, description }: { title?: string; description?: string }) {
  // This would normally be used in Server Components
  // For client components, we're just returning the values
  return { title, description };
}

// For components that still rely on useLocation
export function useLocation() {
  const pathname = nextUsePathname();
  const searchParams = nextUseSearchParams();
  
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

export function useNavigate() {
  const router = useRouter();
  
  return (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}
