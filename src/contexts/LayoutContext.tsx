'use client';

import { createContext, useContext } from 'react';

interface LayoutContextType {
  hasBottomNav: boolean;
}

const LayoutContext = createContext<LayoutContextType>({ hasBottomNav: false });

export function LayoutProvider({
  children,
  hasBottomNav,
}: {
  children: React.ReactNode;
  hasBottomNav: boolean;
}) {
  return (
    <LayoutContext.Provider value={{ hasBottomNav }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
