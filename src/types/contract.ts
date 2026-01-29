// 파일 업로드 관련 타입

export type FileType = 'IMAGE' | 'PDF';

export interface FileUploadItem {
  fileType: FileType;
  contentType: string;
  fileName: string;
}

export interface PresignedUrlRequest {
  items: FileUploadItem[];
}

export interface FileItem {
  file_asset_id: number;
  file_key: string;
  presigned_url: string;
}

export interface PresignedUrlResponse {
  code: string;
  message: string;
  data: {
    file_items: FileItem[];
  };
}

// 쉬운 계약서 관련 타입

export interface EasyContractRequest {
  file_asset_ids: number[];
}

export interface EasyContractData {
  easy_contract_id: number;
  title: string;
  content: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface EasyContractResponse {
  code: string;
  message: string;
  data: EasyContractData;
}

// 파일 업로드 완료 관련 타입

export interface FileMetadata {
  width?: number;
  height?: number;
  pages?: number;
}

export interface FileUploadCompleteItem {
  file_asset_id: number;
  size: number;
  metadata: FileMetadata;
}

export interface FileUploadCompleteRequest {
  file_items: FileUploadCompleteItem[];
}

export interface CompletedFileItem {
  file_asset_id: number;
  file_key: string;
  file_type: FileType;
  size: number;
  status: 'COMPLETED';
  metadata: FileMetadata;
  created_at: string;
}

export interface FileUploadCompleteResponse {
  code: string;
  message: string;
  data: {
    file_items: CompletedFileItem[];
  };
}
