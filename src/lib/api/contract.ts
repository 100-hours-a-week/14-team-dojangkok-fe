import { apiClient } from './client';
import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  EasyContractResponse,
  FileUploadCompleteRequest,
  FileUploadCompleteResponse,
  FileMetadata,
} from '@/types/contract';

/**
 * Presigned URL 발급 요청
 * @param items - 업로드할 파일 정보 배열
 * @returns Presigned URL 정보
 */
export async function getPresignedUrls(
  items: PresignedUrlRequest['items']
): Promise<PresignedUrlResponse> {
  return apiClient<PresignedUrlResponse>('/v1/file-assets/presigned-urls', {
    method: 'POST',
    body: JSON.stringify({ items }),
    requiresAuth: true,
  });
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
 * 파일 업로드 완료 알림
 * @param fileItems - 업로드 완료된 파일 정보
 * @returns 업로드 완료 응답
 */
export async function completeFileUpload(
  request: FileUploadCompleteRequest
): Promise<FileUploadCompleteResponse> {
  return apiClient<FileUploadCompleteResponse>('/v1/file-assets', {
    method: 'POST',
    body: JSON.stringify(request),
    requiresAuth: true,
  });
}

/**
 * 파일 업로드 전체 플로우
 * @param files - 업로드할 파일 배열
 * @returns 업로드된 파일 ID 배열
 */
export async function uploadFiles(files: File[]): Promise<number[]> {
  // 1. Presigned URL 발급 요청
  const items = files.map((file) => ({
    fileType: file.type.startsWith('image/')
      ? ('IMAGE' as const)
      : ('PDF' as const),
    contentType: file.type,
    fileName: file.name,
  }));

  const presignedResponse = await getPresignedUrls(items);

  // 2. S3에 파일 업로드
  const uploadPromises = presignedResponse.data.file_items.map(
    (fileItem, index) =>
      uploadToS3(fileItem.presigned_url, files[index], items[index].contentType)
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
