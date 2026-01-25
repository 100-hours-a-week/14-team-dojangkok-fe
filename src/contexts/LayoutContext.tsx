'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface NavigationGuard {
  message: string;
  subMessage?: string;
}

interface LayoutContextType {
  hasBottomNav: boolean;
  navigationGuard: NavigationGuard | null;
  setNavigationGuard: (guard: NavigationGuard | null) => void;
  pendingPath: string | null;
  setPendingPath: (path: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  hasBottomNav: false,
  navigationGuard: null,
  setNavigationGuard: () => {},
  pendingPath: null,
  setPendingPath: () => {},
});

export function LayoutProvider({
  children,
  hasBottomNav,
}: {
  children: React.ReactNode;
  hasBottomNav: boolean;
}) {
  const [navigationGuard, setNavigationGuard] =
    useState<NavigationGuard | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleSetNavigationGuard = useCallback(
    (guard: NavigationGuard | null) => {
      setNavigationGuard(guard);
    },
    []
  );

  const handleSetPendingPath = useCallback((path: string | null) => {
    setPendingPath(path);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        hasBottomNav,
        navigationGuard,
        setNavigationGuard: handleSetNavigationGuard,
        pendingPath,
        setPendingPath: handleSetPendingPath,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
