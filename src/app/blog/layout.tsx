'use client';

import { ReactNode } from 'react';
import { colors } from '@/styles/colors';

export default function BlogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div 
      style={{ 
        backgroundColor: '#1A1A1A',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
} 