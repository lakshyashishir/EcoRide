
'use client';

import React from 'react';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}
