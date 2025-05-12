
import React from 'react';
import { Inter } from 'next/font/google';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { RightSidebarProvider } from '@/contexts/RightSidebarContext';
import AppLayout from '@/components/layout/AppLayout';
import '../src/index.css';
import { Toaster } from "sonner";

// Define the font
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BlockNoster',
  description: 'Decentralized social platform with Alephium and Nostr',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <NavigationProvider>
          <RightSidebarProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                <AppLayout>
                  {children}
                </AppLayout>
              </main>
              <Toaster position="bottom-right" closeButton />
            </div>
          </RightSidebarProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
