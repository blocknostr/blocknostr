
'use client';

// This file provides compatibility shims between Next.js App Router and old React Router usage
// for the transition period while migrating

import React from 'react';
import * as NavigationImports from 'next/navigation';
import Link from 'next/link';

// Export directly from Next.js
export const useRouter = NavigationImports.useRouter;
export const usePathname = NavigationImports.usePathname;
export const useSearchParams = NavigationImports.useSearchParams;

// Compatibility: create a useParams hook that returns params from React Router format
export function useParams() {
  // In Next.js App Router, params are passed as props to page components
  // This is just a stub for transition purposes
  return {};
}

// Compatibility for React Router's Navigate component
export function Navigate({ to, replace }: { to: string, replace?: boolean }) {
  const router = NavigationImports.useRouter();
  
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
  const pathname = NavigationImports.usePathname();
  const searchParams = NavigationImports.useSearchParams();
  
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

export function useNavigate() {
  const router = NavigationImports.useRouter();
  
  return React.useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);
}
