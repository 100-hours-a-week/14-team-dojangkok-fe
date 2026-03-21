'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { EasyContractStatus } from '@/types/contract';

interface AnalysisState {
  easyContractId: number | null;
  status: EasyContractStatus | null;
  error: string | null;
}

interface AnalysisContextType {
  analysisState: AnalysisState;
  startAnalysis: (easyContractId: number) => void;
  completeAnalysis: (easyContractId: number) => void;
  failAnalysis: (easyContractId: number, error: string) => void;
  clearAnalysis: () => void;
}

const STORAGE_KEY = 'analysisState';

const initialState: AnalysisState = {
  easyContractId: null,
  status: null,
  error: null,
};

function loadFromStorage(): AnalysisState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return initialState;
}

function saveToStorage(state: AnalysisState) {
  try {
    if (state.status === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>(loadFromStorage);

  // 다른 탭에서 localStorage 변경 시 React 상태 동기화
  // (탭 A에서 startAnalysis → 탭 B가 SSE 이벤트 수신해도 easyContractId 인식 가능)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      const next = e.newValue ? JSON.parse(e.newValue) : initialState;
      setAnalysisState(next);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateState = useCallback((state: AnalysisState) => {
    saveToStorage(state);
    setAnalysisState(state);
  }, []);

  const startAnalysis = useCallback(
    (easyContractId: number) => {
      updateState({
        easyContractId,
        status: 'PROCESSING',
        error: null,
      });
    },
    [updateState]
  );

  const completeAnalysis = useCallback(
    (easyContractId: number) => {
      updateState({
        easyContractId,
        status: 'COMPLETED',
        error: null,
      });
    },
    [updateState]
  );

  const failAnalysis = useCallback(
    (easyContractId: number, error: string) => {
      updateState({
        easyContractId,
        status: 'FAILED',
        error,
      });
    },
    [updateState]
  );

  const clearAnalysis = useCallback(() => {
    updateState(initialState);
  }, [updateState]);

  return (
    <AnalysisContext.Provider
      value={{
        analysisState,
        startAnalysis,
        completeAnalysis,
        failAnalysis,
        clearAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
