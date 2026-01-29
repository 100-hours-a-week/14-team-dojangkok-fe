'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
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

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    easyContractId: null,
    status: null,
    error: null,
  });

  const startAnalysis = useCallback((easyContractId: number) => {
    setAnalysisState({
      easyContractId,
      status: 'PROCESSING',
      error: null,
    });
  }, []);

  const completeAnalysis = useCallback((easyContractId: number) => {
    setAnalysisState({
      easyContractId,
      status: 'COMPLETED',
      error: null,
    });
  }, []);

  const failAnalysis = useCallback((easyContractId: number, error: string) => {
    setAnalysisState({
      easyContractId,
      status: 'FAILED',
      error,
    });
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisState({
      easyContractId: null,
      status: null,
      error: null,
    });
  }, []);

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
