import { apiClient } from './client';
import {
  CreateHomeNoteResponse,
  GetHomeNotesResponse,
  GetHomeNoteDetailResponse,
  UpdateHomeNoteTitleResponse,
  AttachHomeNoteFileResponse,
  GetChecklistResponse,
  UpdateChecklistRequest,
  UpdateChecklistResponse,
  UpdateChecklistItemStatusResponse,
} from '@/types/homeNote';
import { uploadHomeNoteFiles } from './contract';

/**
 * 집 노트 목록 조회
 * @param cursor - 페이지네이션 커서 (선택)
 * @returns 집 노트 목록
 */
export async function getHomeNotes(
  cursor?: string
): Promise<GetHomeNotesResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }

  const url = `/v1/home-notes${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<GetHomeNotesResponse>(url, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * 집 노트 생성
 * @param title - 집 노트 제목
 * @returns 생성된 집 노트 및 체크리스트 정보
 */
export async function createHomeNote(
  title: string
): Promise<CreateHomeNoteResponse> {
  return apiClient<CreateHomeNoteResponse>('/v1/home-notes', {
    method: 'POST',
    body: JSON.stringify({ title }),
    requiresAuth: true,
  });
}

/**
 * 집 노트 상세 조회
 * @param homeNoteId - 집 노트 ID
 * @param cursor - 페이지네이션 커서 (선택, 파일 목록용)
 * @returns 집 노트 상세 정보 및 파일 목록
 */
export async function getHomeNoteDetail(
  homeNoteId: number,
  cursor?: string
): Promise<GetHomeNoteDetailResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }

  const url = `/v1/home-notes/${homeNoteId}${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<GetHomeNoteDetailResponse>(url, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * 집 노트 제목 수정
 * @param homeNoteId - 집 노트 ID
 * @param title - 새로운 제목
 * @returns 수정된 집 노트 정보
 */
export async function updateHomeNoteTitle(
  homeNoteId: number,
  title: string
): Promise<UpdateHomeNoteTitleResponse> {
  return apiClient<UpdateHomeNoteTitleResponse>(
    `/v1/home-notes/${homeNoteId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
      requiresAuth: true,
    }
  );
}

/**
 * 집 노트 삭제
 * @param homeNoteId - 집 노트 ID
 */
export async function deleteHomeNote(homeNoteId: number): Promise<void> {
  await apiClient<void>(`/v1/home-notes/${homeNoteId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

/**
 * 집 노트 파일 첨부
 * @param homeNoteId - 집 노트 ID
 * @param fileAssetIds - 첨부할 파일 에셋 ID 배열
 * @returns 첨부된 파일 정보
 */
export async function attachHomeNoteFiles(
  homeNoteId: number,
  fileAssetIds: number[]
): Promise<AttachHomeNoteFileResponse> {
  return apiClient<AttachHomeNoteFileResponse>(
    `/v1/home-notes/${homeNoteId}/files`,
    {
      method: 'POST',
      body: JSON.stringify({
        files: fileAssetIds.map((id) => ({ file_asset_id: id })),
      }),
      requiresAuth: true,
    }
  );
}

/**
 * 집 노트 사진 업로드 전체 플로우
 * @param homeNoteId - 집 노트 ID
 * @param files - 업로드할 파일 배열
 * @param currentFileCount - 현재 집노트에 첨부된 파일 개수
 * @returns 첨부된 파일 정보
 */
export async function uploadHomeNotePhotos(
  homeNoteId: number,
  files: File[],
  currentFileCount: number = 0
): Promise<AttachHomeNoteFileResponse> {
  // 1-3단계: 파일 업로드 공통 플로우 (S3 업로드)
  const fileAssetIds = await uploadHomeNoteFiles(files, currentFileCount);

  // 4단계: 집 노트 파일 첨부
  return await attachHomeNoteFiles(homeNoteId, fileAssetIds);
}

/**
 * 체크리스트 조회
 * @param homeNoteId - 집 노트 ID
 * @returns 체크리스트 정보
 */
export async function getChecklist(
  homeNoteId: number
): Promise<GetChecklistResponse> {
  return apiClient<GetChecklistResponse>(
    `/v1/home-notes/${homeNoteId}/checklists`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
}

/**
 * 체크리스트 수정
 * @param homeNoteId - 집 노트 ID
 * @param checklists - 수정할 체크리스트 항목 배열
 * @returns 수정된 체크리스트 정보
 */
export async function updateChecklist(
  homeNoteId: number,
  checklists: UpdateChecklistRequest['checklists']
): Promise<UpdateChecklistResponse> {
  // API 요청 시 is_completed (snake_case)로 변환
  const requestBody = {
    checklists: checklists.map((item) => ({
      checklist_item_id: item.checklist_item_id,
      content: item.content,
      is_completed: item.isCompleted,
    })),
  };

  return apiClient<UpdateChecklistResponse>(
    `/v1/home-notes/${homeNoteId}/checklists`,
    {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      requiresAuth: true,
    }
  );
}

/**
 * 체크리스트 항목 상태 변경
 * @param homeNoteId - 집 노트 ID
 * @param checklistItemId - 체크리스트 항목 ID
 * @param isCompleted - 완료 여부
 * @returns 변경된 항목 정보
 */
export async function updateChecklistItemStatus(
  homeNoteId: number,
  checklistItemId: number,
  isCompleted: boolean
): Promise<UpdateChecklistItemStatusResponse> {
  return apiClient<UpdateChecklistItemStatusResponse>(
    `/v1/home-notes/${homeNoteId}/checklists/items/${checklistItemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted }),
      requiresAuth: true,
    }
  );
}

/**
 * 집 노트 첨부 파일 삭제
 * @param homeNoteId - 집 노트 ID
 * @param fileId - 파일 ID (file_asset_id)
 */
export async function deleteHomeNoteFile(
  homeNoteId: number,
  fileId: number
): Promise<void> {
  await apiClient<void>(`/v1/home-notes/${homeNoteId}/files/${fileId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}
