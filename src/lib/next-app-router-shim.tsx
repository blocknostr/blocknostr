
// This file provides compatibility shims for Next.js App Router features
// while still using React Router and Vite

import React from 'react';
import { useLocation } from 'react-router-dom';

// Create a shim for next/navigation hooks
export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

export function useParams() {
  // In a real implementation, this would use the React Router useParams
  // For now, we'll return an empty object
  return {};
}

// Next.js Link component shim is in src/components/Link.tsx

// Mock metadata helper
export function generateMetadata({ title, description }: { title?: string; description?: string }) {
  // This would normally update the document head
  // In a client-side only app, this is just a placeholder
  return { title, description };
}
