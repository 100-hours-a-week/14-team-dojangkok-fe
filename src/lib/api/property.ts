// 매물 게시글 API

import { apiClient } from './client';
import type {
  PropertyPostListResponseDto,
  PropertyPostSearchResponseDto,
  PropertyPostSearchRequestDto,
  PropertyPostSearchCountResponseDto,
  PropertyVisibilityUpdateDto,
  PropertyDealStatusUpdateDto,
  PropertyPostDetailDto,
} from '@/types/property';

const BASE_URL = '/v2/property-posts';

// ===== 매물 목록 조회 =====

/**
 * 전체 매물 목록 조회 (GET)
 * @param cursor 다음 페이지 커서
 */
export async function getAllPropertyPosts(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostListResponseDto }>(url, {
    requiresAuth: true,
  });
}

/**
 * 스크랩한 매물 목록 조회
 */
export async function getBookmarkedPropertyPosts(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/bookmarks${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostListResponseDto }>(url, {
    requiresAuth: true,
  });
}

/**
 * 숨김 처리한 매물 목록 조회
 */
export async function getHiddenPropertyPosts(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/hidden${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostListResponseDto }>(url, {
    requiresAuth: true,
  });
}

/**
 * 거래 완료된 매물 목록 조회
 */
export async function getCompletedPropertyPosts(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/completed${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostListResponseDto }>(url, {
    requiresAuth: true,
  });
}

/**
 * 거래 중인 매물 목록 조회
 */
export async function getTradingPropertyPosts(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/trading${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostListResponseDto }>(url, {
    requiresAuth: true,
  });
}

// ===== 매물 검색 =====

/**
 * 매물 검색 (POST)
 * @param searchRequest 검색 조건
 * @param cursor 다음 페이지 커서
 */
export async function searchPropertyPosts(
  searchRequest: PropertyPostSearchRequestDto,
  cursor?: string
) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}/searches${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: PropertyPostSearchResponseDto }>(url, {
    method: 'POST',
    body: JSON.stringify(searchRequest),
    requiresAuth: true,
  });
}

/**
 * 매물 검색 결과 개수 조회
 * @param searchRequest 검색 조건
 */
export async function getSearchCount(
  searchRequest: PropertyPostSearchRequestDto
) {
  return apiClient<{ data: PropertyPostSearchCountResponseDto }>(
    `${BASE_URL}/searches/counts`,
    {
      method: 'POST',
      body: JSON.stringify(searchRequest),
      requiresAuth: true,
    }
  );
}

// ===== 매물 상세 조회 =====

/**
 * 매물 상세 조회
 * @param propertyPostId 매물 게시글 ID
 */
export async function getPropertyPost(propertyPostId: number) {
  return apiClient<{ data: PropertyPostDetailDto }>(
    `${BASE_URL}/${propertyPostId}`,
    { requiresAuth: true }
  );
}

// ===== 매물 액션 =====

/**
 * 스크랩 추가
 * @param propertyPostId 매물 게시글 ID
 */
export async function addBookmark(propertyPostId: number) {
  return apiClient<{ data: null }>(`${BASE_URL}/${propertyPostId}/bookmarks`, {
    method: 'POST',
    requiresAuth: true,
  });
}

/**
 * 스크랩 해제
 * @param propertyPostId 매물 게시글 ID
 */
export async function removeBookmark(propertyPostId: number) {
  return apiClient<{ data: null }>(`${BASE_URL}/${propertyPostId}/bookmarks`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

/**
 * 매물 숨김/노출 상태 변경
 * @param propertyPostId 매물 게시글 ID
 * @param isHidden 숨김 여부
 */
export async function updatePropertyVisibility(
  propertyPostId: number,
  isHidden: boolean
) {
  const body: PropertyVisibilityUpdateDto = { is_hidden: isHidden };

  return apiClient<{ data: null }>(
    `${BASE_URL}/${propertyPostId}/post-status`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      requiresAuth: true,
    }
  );
}

/**
 * 거래 상태 변경
 * @param propertyPostId 매물 게시글 ID
 * @param dealStatus 거래 상태 (TRADING | COMPLETED)
 */
export async function updateDealStatus(
  propertyPostId: number,
  dealStatus: 'TRADING' | 'COMPLETED'
) {
  const body: PropertyDealStatusUpdateDto = { deal_status: dealStatus };

  return apiClient<{ data: null }>(
    `${BASE_URL}/${propertyPostId}/deal-status`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      requiresAuth: true,
    }
  );
}

/**
 * 매물 삭제 (소프트 삭제)
 * @param propertyPostId 매물 게시글 ID
 */
export async function deletePropertyPost(propertyPostId: number) {
  return apiClient<{ data: null }>(`${BASE_URL}/${propertyPostId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export interface PropertyPostUpdateRequestDto {
  title?: string;
  easy_contract_id?: number;
  address_main?: string;
  address_detail?: string;
  price_main?: number;
  price_monthly?: number;
  content?: string;
  property_type?: string;
  rent_type?: string;
  exclusive_area_m2?: number;
  is_basement?: boolean;
  floor?: number;
  maintenance_fee?: number;
}

/**
 * 매물 수정
 */
export async function updatePropertyPost(
  propertyPostId: number,
  data: PropertyPostUpdateRequestDto
) {
  return apiClient<{ data: PropertyPostDetailDto }>(
    `${BASE_URL}/${propertyPostId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
      requiresAuth: true,
    }
  );
}

// ===== 매물 생성 =====

export interface PropertyPostCreateRequestDto {
  title: string;
  address_main: string;
  address_detail?: string;
  price_main: number;
  price_monthly?: number;
  content: string;
  property_type: string;
  rent_type: string;
  exclusive_area_m2: number;
  is_basement: boolean;
  floor: number;
  maintenance_fee: number;
  easy_contract_id?: number;
}

export interface PropertyPostCreateResponseDto {
  property_post_id: number;
}

export interface PresignedUrlRequestDto {
  file_items: Array<{
    file_type: 'IMAGE';
    content_type: string;
    file_name: string;
    size_bytes: number;
  }>;
}

export interface PresignedUrlResponseDto {
  success_file_items: Array<{
    presigned_url: string;
    file_asset_id: number;
  }>;
  failed_file_items: Array<{
    file_name: string;
    reason: string;
  }>;
}

export interface FileAttachRequestDto {
  items: Array<{
    file_asset_id: number;
  }>;
}

/**
 * 매물 생성
 * @param createRequest 매물 생성 요청 DTO
 * @returns property_post_id
 */
export async function createPropertyPost(
  createRequest: PropertyPostCreateRequestDto
) {
  return apiClient<{ data: PropertyPostCreateResponseDto }>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(createRequest),
    requiresAuth: true,
  });
}

/**
 * 이미지별 Presigned URL 발급
 * @param propertyPostId 매물 게시글 ID
 * @param fileInfo 파일 정보
 */
export async function getPresignedUrl(
  propertyPostId: number,
  fileInfo: {
    file_name: string;
    size_bytes: number;
    content_type: string;
  }
) {
  const body: PresignedUrlRequestDto = {
    file_items: [
      {
        file_type: 'IMAGE',
        content_type: fileInfo.content_type,
        file_name: fileInfo.file_name,
        size_bytes: fileInfo.size_bytes,
      },
    ],
  };

  return apiClient<{ data: PresignedUrlResponseDto }>(
    `${BASE_URL}/files/presigned-urls`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth: true,
    }
  );
}

/**
 * S3에 이미지 직접 업로드
 * @param presignedUrl S3 Presigned URL
 * @param file 파일 객체
 * @param contentType Content-Type
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
  contentType: string
) {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error('S3 upload failed');
  }

  return response;
}

/**
 * 업로드 완료 통보 (S3 업로드 직후 호출)
 */
export async function completePropertyFileUpload(fileAssetId: number) {
  return apiClient<{ data: null }>(`${BASE_URL}/files/complete`, {
    method: 'POST',
    body: JSON.stringify({
      file_items: [{ file_asset_id: fileAssetId }],
    }),
    requiresAuth: true,
  });
}

/**
 * 게시글과 이미지 최종 연결
 * @param propertyPostId 매물 게시글 ID
 * @param fileAssetIds 파일 에셋 ID 목록
 */
/**
 * 매물 이미지 삭제
 * @param fileAssetId 파일 에셋 ID
 */
export async function deletePropertyFile(fileAssetId: number) {
  return apiClient<{ data: null }>(`${BASE_URL}/files/${fileAssetId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function attachFilesToPost(
  propertyPostId: number,
  fileAssetIds: number[]
) {
  const body: FileAttachRequestDto = {
    items: fileAssetIds.map((id) => ({ file_asset_id: id })),
  };

  return apiClient<{ data: null }>(`${BASE_URL}/${propertyPostId}/files`, {
    method: 'POST',
    body: JSON.stringify(body),
    requiresAuth: true,
  });
}
