// 파일 업로드 관련 타입

export type FileType = 'IMAGE' | 'PDF';

export interface FileUploadItem {
  file_type: FileType;
  content_type: string;
  file_name: string;
}

export interface PresignedUrlRequest {
  file_items: FileUploadItem[];
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

export type EasyContractStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface EasyContractData {
  easy_contract_id: number;
  title: string;
  content: string;
  status: EasyContractStatus;
  created_at: string;
}

export interface EasyContractResponse {
  code: string;
  message: string;
  data: EasyContractData;
}

// 쉬운 계약서 목록 조회 관련 타입

export interface EasyContractListItem {
  easy_contract_id: number;
  title: string;
  status: EasyContractStatus;
  created_at: string;
  updated_at: string;
}

export interface EasyContractListData {
  easyContractListItemList: EasyContractListItem[];
  has_next: boolean;
  limit: number;
  next_cursor: string | null;
}

export interface EasyContractListResponse {
  code: string;
  message: string;
  data: EasyContractListData;
}

// 쉬운 계약서 제목 수정 관련 타입

export interface UpdateEasyContractTitleRequest {
  title: string;
}

export interface UpdateEasyContractTitleData {
  easy_contract_id: number;
  title: string;
  updated_at: string;
}

export interface UpdateEasyContractTitleResponse {
  code: string;
  message: string;
  data: UpdateEasyContractTitleData;
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
