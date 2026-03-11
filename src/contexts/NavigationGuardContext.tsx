'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface NavigationGuard {
  message: string;
  subMessage?: string;
}

interface NavigationGuardContextType {
  navigationGuard: NavigationGuard | null;
  pendingPath: string | null;
  setNavigationGuard: (guard: NavigationGuard | null) => void;
  setPendingPath: (path: string | null) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  navigationGuard: null,
  pendingPath: null,
  setNavigationGuard: () => {},
  setPendingPath: () => {},
});

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigationGuard, setNavigationGuardState] =
    useState<NavigationGuard | null>(null);
  const [pendingPath, setPendingPathState] = useState<string | null>(null);

  const setNavigationGuard = useCallback((guard: NavigationGuard | null) => {
    setNavigationGuardState(guard);
  }, []);

  const setPendingPath = useCallback((path: string | null) => {
    setPendingPathState(path);
  }, []);

  return (
    <NavigationGuardContext.Provider
      value={{ navigationGuard, pendingPath, setNavigationGuard, setPendingPath }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
