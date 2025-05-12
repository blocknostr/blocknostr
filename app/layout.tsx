
'use client';

import React from 'react';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { RightSidebarProvider } from '@/contexts/RightSidebarContext';
import AppLayout from '@/components/layout/AppLayout';
import '../src/index.css';
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark">
      <body className="font-sans">
        {/* This is a client-side only replacement of Next.js RootLayout */}
        {/* The actual routing will be handled by React Router */}
        {children}
      </body>
    </div>
  );
}
