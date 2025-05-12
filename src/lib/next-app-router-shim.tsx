
'use client';

// This file provides compatibility shims between Next.js App Router and old React Router usage
// for the transition period while migrating

import React from 'react';
import * as NextNavigation from 'next/navigation';
import Link from 'next/link';

// Export functions by directly referencing the imported module
export const usePathname = NextNavigation.usePathname;
export const useRouter = NextNavigation.useRouter;
export const useSearchParams = NextNavigation.useSearchParams;

// Compatibility: create a useParams hook that returns params from React Router format
export function useParams() {
  // In Next.js App Router, params are passed as props to page components
  // This is just a stub for transition purposes
  return {};
}

// Compatibility for React Router's Navigate component
export function Navigate({ to, replace }: { to: string, replace?: boolean }) {
  const router = NextNavigation.useRouter();
  
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
  const pathname = NextNavigation.usePathname();
  const searchParams = NextNavigation.useSearchParams();
  
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

export function useNavigate() {
  const router = NextNavigation.useRouter();
  
  return (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}
