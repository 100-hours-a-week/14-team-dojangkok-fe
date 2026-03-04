export interface AnalysisResult {
  id: string;
  address: string;
  date: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
