'use client';

import AuthContextProvider from '@/contexts/AuthContext';

export default function Layout({ children }:any) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
