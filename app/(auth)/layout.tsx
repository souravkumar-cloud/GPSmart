'use client';

import AuthContextProvider from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
