// 집 노트 관련 타입

export interface ChecklistItem {
  checklist_item_id: number;
  content: string;
  is_completed: boolean;
}

export interface Checklist {
  checklist_id: number;
  checklist_items: ChecklistItem[];
}

export interface HomeNoteData {
  home_note_id: number;
  title: string;
  checklist: Checklist;
}

export interface CreateHomeNoteRequest {
  title: string;
}

export interface CreateHomeNoteResponse {
  code: string;
  message: string;
  data: HomeNoteData;
}

// 집 노트 목록 조회 관련 타입

export interface PreviewImage {
  file_asset_id: number;
  presigned_url: string;
}

export interface HomeNoteItem {
  home_note_id: number;
  title: string;
  file_count: number;
  created_at: string;
  updated_at: string;
  preview_images?: PreviewImage[];
}

export interface GetHomeNotesData {
  items: HomeNoteItem[];
  hasNext: boolean;
  limit: number;
  next_cursor: string | null;
}

export interface GetHomeNotesResponse {
  code: string;
  message: string;
  data: GetHomeNotesData;
}

// 집 노트 상세 조회 관련 타입

export interface HomeNoteFile {
  home_note_file_id: number;
  file_asset_id: number;
  presigned_url: string;
  sort_order: number;
  created_at: string;
}

export interface HomeNoteDetail {
  home_note_id: number;
  title: string;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface GetHomeNoteDetailData {
  home_note: HomeNoteDetail;
  files: HomeNoteFile[];
  hasNext: boolean;
  limit: number;
  next_cursor: string | null;
}

export interface GetHomeNoteDetailResponse {
  code: string;
  message: string;
  data: GetHomeNoteDetailData;
}

// 집 노트 제목 수정 관련 타입

export interface UpdateHomeNoteTitleRequest {
  title: string;
}

export interface UpdateHomeNoteTitleData {
  home_note_id: number;
  title: string;
}

export interface UpdateHomeNoteTitleResponse {
  code: string;
  message: string;
  data: UpdateHomeNoteTitleData;
}

// 집 노트 파일 첨부 관련 타입

export interface AttachHomeNoteFileRequest {
  files: Array<{
    file_asset_id: number;
  }>;
}

export interface AttachedFileItem {
  home_note_file_id: number;
  file_asset_id: number;
  file_type: 'IMAGE' | 'PDF';
  asset_status: string;
}

export interface AttachHomeNoteFileData {
  file_items: AttachedFileItem[];
}

export interface AttachHomeNoteFileResponse {
  code: string;
  message: string;
  data: AttachHomeNoteFileData;
}

// 체크리스트 조회 관련 타입

export interface GetChecklistResponse {
  code: string;
  message: string;
  data: Checklist;
}

// 체크리스트 수정 관련 타입

export interface UpdateChecklistItemRequest {
  checklist_item_id: number;
  content: string;
  isCompleted: boolean;
}

export interface UpdateChecklistRequest {
  checklists: UpdateChecklistItemRequest[];
}

export interface UpdateChecklistResponse {
  code: string;
  message: string;
  data: Checklist;
}

// 체크리스트 항목 상태 변경 관련 타입

export interface UpdateChecklistItemStatusRequest {
  is_completed: boolean;
}

export interface UpdateChecklistItemStatusData {
  checklist_item_id: number;
  is_completed: boolean;
}

export interface UpdateChecklistItemStatusResponse {
  code: string;
  message: string;
  data: UpdateChecklistItemStatusData;
}
