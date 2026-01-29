// 집 노트 API 응답 타입

export interface HomeNoteItem {
  home_note_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  file_count: number;
  preview_images: string[];
}

export interface HomeNotesResponse {
  code: string;
  message: string;
  data: {
    hasNext: boolean;
    items: HomeNoteItem[];
    limit: number;
    next_cursor: string | null;
  };
}
