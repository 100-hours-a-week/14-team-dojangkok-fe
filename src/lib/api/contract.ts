import { apiClient } from './client';
import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  EasyContractResponse,
  EasyContractListResponse,
  UpdateEasyContractTitleResponse,
  FileUploadCompleteRequest,
  FileUploadCompleteResponse,
  FileMetadata,
} from '@/types/contract';
import {
  validateEasyContractFiles,
  validateHomeNoteFiles,
} from '@/utils/fileValidation';

/**
 * Presigned URL 발급 요청 (쉬운 계약서 전용)
 * @param items - 업로드할 파일 정보 배열
 * @returns Presigned URL 정보
 */
export async function getPresignedUrls(
  items: PresignedUrlRequest['file_items']
): Promise<PresignedUrlResponse> {
  return apiClient<PresignedUrlResponse>(
    '/v1/easy-contracts/files/presigned-urls',
    {
      method: 'POST',
      body: JSON.stringify({ file_items: items }),
      requiresAuth: true,
    }
  );
}

/**
 * Presigned URL 발급 요청 (집노트 전용)
 * @param homeNoteId - 집 노트 ID
 * @param items - 업로드할 파일 정보 배열
 * @returns Presigned URL 정보
 */
export async function getPresignedUrlsForHomeNote(
  homeNoteId: number,
  items: PresignedUrlRequest['file_items']
): Promise<PresignedUrlResponse> {
  return apiClient<PresignedUrlResponse>(
    `/v1/home-notes/${homeNoteId}/files/presigned-urls`,
    {
      method: 'POST',
      body: JSON.stringify({ file_items: items }),
      requiresAuth: true,
    }
  );
}

/**
 * S3에 파일 업로드
 * @param presignedUrl - S3 Presigned URL
 * @param file - 업로드할 파일
 * @param contentType - 파일 MIME 타입
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('S3 업로드 실패');
  }
}

/**
 * 파일 메타데이터 추출
 * @param file - 파일 객체
 * @returns 파일 메타데이터 (이미지: width/height, PDF: pages)
 */
async function extractFileMetadata(file: File): Promise<FileMetadata> {
  if (file.type.startsWith('image/')) {
    // 이미지 파일: width, height 추출
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error('이미지 메타데이터 추출 실패'));
      };
      img.src = URL.createObjectURL(file);
    });
  } else if (file.type === 'application/pdf') {
    // PDF 파일: pages 정보 (브라우저에서 페이지 수를 추출할 수 없으므로 기본값 사용)
    // 실제 페이지 수는 백엔드에서 처리하거나 PDF.js 라이브러리 필요
    return {
      pages: 1, // 기본값, 필요시 PDF.js로 실제 페이지 수 추출
    };
  }
  return {};
}

/**
 * 파일 업로드 완료 알림 (쉬운 계약서 전용)
 * @param fileItems - 업로드 완료된 파일 정보
 * @returns 업로드 완료 응답
 */
export async function completeFileUpload(
  request: FileUploadCompleteRequest
): Promise<FileUploadCompleteResponse> {
  return apiClient<FileUploadCompleteResponse>(
    '/v1/easy-contracts/files/complete',
    {
      method: 'POST',
      body: JSON.stringify(request),
      requiresAuth: true,
    }
  );
}

/**
 * 파일 업로드 완료 알림 (집 노트 전용)
 * @param fileItems - 업로드 완료된 파일 정보
 * @returns 업로드 완료 응답
 */
export async function completeFileUploadForHomeNote(
  request: FileUploadCompleteRequest
): Promise<FileUploadCompleteResponse> {
  return apiClient<FileUploadCompleteResponse>(
    '/v1/home-notes/files/complete',
    {
      method: 'POST',
      body: JSON.stringify(request),
      requiresAuth: true,
    }
  );
}

/**
 * 에러 처리 헬퍼 함수
 */
function handleFileUploadError(error: any): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const { code, data } = error;

    // 파일 크기 초과
    if (code === 'FILE_SIZE_EXCEEDED') {
      const errorData = data as any;
      const maxSizeMB = errorData.max_size_bytes
        ? (errorData.max_size_bytes / (1024 * 1024)).toFixed(0)
        : '15';
      const fileNames = errorData.size_exceeded_files
        ?.map((f: any) => f.file_name)
        .join(', ');
      throw new Error(`파일 크기가 ${maxSizeMB}MB를 초과합니다: ${fileNames}`);
    }

    // 파일 개수 초과
    if (code === 'FILE_COUNT_EXCEEDED') {
      throw new Error(
        typeof error.message === 'string'
          ? error.message
          : '파일 개수가 제한을 초과했습니다.'
      );
    }

    // Content-Type 에러
    if (code === 'FILE_CONTENT_TYPE_NOT_ALLOWED') {
      throw new Error('허용되지 않는 파일 형식입니다.');
    }

    // 업로드 완료 실패
    if (code === 'FILE_UPLOAD_NOT_COMPLETED') {
      const errorData = data as any;
      throw new Error(
        `파일 업로드 검증 실패: ${errorData.failed_files?.length || 0}개`
      );
    }
  }

  throw new Error('파일 업로드 중 오류가 발생했습니다.');
}

/**
 * 파일 업로드 전체 플로우 (쉬운 계약서 전용)
 * @param files - 업로드할 파일 배열
 * @returns 업로드된 파일 ID 배열
 */
export async function uploadFiles(files: File[]): Promise<number[]> {
  try {
    // 0. 프론트엔드 검증 (API 호출 전 차단)
    const validationError = validateEasyContractFiles(files);
    if (validationError) {
      throw new Error(validationError.message);
    }

    // 1. Presigned URL 발급 요청
    const items = files.map((file) => ({
      file_type: file.type.startsWith('image/')
        ? ('IMAGE' as const)
        : ('PDF' as const),
      content_type: file.type,
      file_name: file.name,
      size_bytes: file.size,
    }));

    console.log('Presigned URL 요청 데이터:', { file_items: items });

    const presignedResponse = await getPresignedUrls(items);

    // 2. S3에 파일 업로드
    const uploadPromises = presignedResponse.data.file_items.map(
      (fileItem, index) =>
        uploadToS3(
          fileItem.presigned_url,
          files[index],
          items[index].content_type
        )
    );

    await Promise.all(uploadPromises);

    // 3. 파일 메타데이터 추출
    const metadataPromises = files.map((file) => extractFileMetadata(file));
    const metadataResults = await Promise.all(metadataPromises);

    // 4. 파일 업로드 완료 알림
    const completeRequest: FileUploadCompleteRequest = {
      file_items: presignedResponse.data.file_items.map((fileItem, index) => ({
        file_asset_id: fileItem.file_asset_id,
        size: files[index].size,
        metadata: metadataResults[index],
      })),
    };

    await completeFileUpload(completeRequest);

    // 5. file_asset_id 배열 반환
    return presignedResponse.data.file_items.map((item) => item.file_asset_id);
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    handleFileUploadError(error);
  }
}

/**
 * 쉬운 계약서 생성
 * @param fileAssetIds - 업로드된 파일 ID 배열
 * @returns 생성된 쉬운 계약서 정보
 */
export async function createEasyContract(
  fileAssetIds: number[]
): Promise<EasyContractResponse> {
  return apiClient<EasyContractResponse>('/v1/easy-contracts', {
    method: 'POST',
    body: JSON.stringify({ file_asset_ids: fileAssetIds }),
    requiresAuth: true,
  });
}

/**
 * 쉬운 계약서 상태 조회
 * @param easyContractId - 쉬운 계약서 ID
 * @returns 쉬운 계약서 정보
 */
export async function getEasyContract(
  easyContractId: number
): Promise<EasyContractResponse> {
  return apiClient<EasyContractResponse>(
    `/v1/easy-contracts/${easyContractId}`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
}

/**
 * 쉬운 계약서 목록 조회
 * @param cursor - 페이지네이션 커서 (선택)
 * @returns 쉬운 계약서 목록
 */
export async function getEasyContractList(
  cursor?: string
): Promise<EasyContractListResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }

  const url = `/v1/easy-contracts${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<EasyContractListResponse>(url, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * 쉬운 계약서 제목 수정
 * @param easyContractId - 쉬운 계약서 ID
 * @param title - 새로운 제목
 * @returns 수정된 쉬운 계약서 정보
 */
export async function updateEasyContractTitle(
  easyContractId: number,
  title: string
): Promise<UpdateEasyContractTitleResponse> {
  return apiClient<UpdateEasyContractTitleResponse>(
    `/v1/easy-contracts/${easyContractId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
      requiresAuth: true,
    }
  );
}

/**
 * 쉬운 계약서 삭제
 * @param easyContractId - 쉬운 계약서 ID
 */
export async function deleteEasyContract(
  easyContractId: number
): Promise<void> {
  await apiClient<void>(`/v1/easy-contracts/${easyContractId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

/**
 * 집노트 파일 업로드 전체 플로우
 * @param homeNoteId - 집 노트 ID
 * @param files - 업로드할 파일 배열
 * @param currentFileCount - 현재 집노트에 첨부된 파일 개수
 * @returns 업로드된 파일 ID 배열
 */
export async function uploadHomeNoteFiles(
  homeNoteId: number,
  files: File[],
  currentFileCount: number = 0
): Promise<number[]> {
  try {
    // 0. 프론트엔드 검증 (API 호출 전 차단)
    const validationError = validateHomeNoteFiles(files, currentFileCount);
    if (validationError) {
      throw new Error(validationError.message);
    }

    // 1. Presigned URL 발급 요청 (집노트용)
    const items = files.map((file) => ({
      file_type: 'IMAGE' as const,
      content_type: file.type,
      file_name: file.name,
      size_bytes: file.size,
    }));

    const presignedResponse = await getPresignedUrlsForHomeNote(homeNoteId, items);

    // 집노트 API는 success_file_items와 failed_file_items로 구분
    const successItems = presignedResponse.data.success_file_items || [];
    const failedItems = presignedResponse.data.failed_file_items || [];

    if (successItems.length === 0) {
      throw new Error('업로드 가능한 파일이 없습니다.');
    }

    // 2. S3에 파일 업로드 (성공한 항목만)
    const uploadPromises = successItems.map((fileItem, index) =>
      uploadToS3(
        fileItem.presigned_url,
        files[index],
        items[index].content_type
      )
    );

    await Promise.all(uploadPromises);

    // 3. 파일 메타데이터 추출
    const metadataPromises = files
      .slice(0, successItems.length)
      .map((file) => extractFileMetadata(file));
    const metadataResults = await Promise.all(metadataPromises);

    // 4. 파일 업로드 완료 알림 (집 노트 전용 API 사용)
    const completeRequest: FileUploadCompleteRequest = {
      file_items: successItems.map((fileItem, index) => ({
        file_asset_id: fileItem.file_asset_id,
        size: files[index].size,
        metadata: metadataResults[index],
      })),
    };

    await completeFileUploadForHomeNote(completeRequest);

    // 5. file_asset_id 배열 반환
    return successItems.map((item) => item.file_asset_id);
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    handleFileUploadError(error);
  }
}
