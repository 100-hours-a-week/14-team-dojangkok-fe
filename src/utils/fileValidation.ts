/**
 * 파일 업로드 검증 유틸리티
 */

// 파일 정책 상수
export const FILE_POLICIES = {
  EASY_CONTRACT: {
    MAX_COUNT: 5,
    MAX_SIZE_MB: 15,
    ALLOWED_EXTENSIONS: ['png', 'jpg', 'jpeg', 'pdf'],
    ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  HOME_NOTE: {
    MAX_COUNT: 50,
    MAX_SIZE_MB: 10,
    ALLOWED_EXTENSIONS: ['png', 'jpg', 'jpeg'],
    ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg'],
  },
} as const;

export type FileValidationError = {
  type: 'COUNT' | 'SIZE' | 'EXTENSION';
  message: string;
  invalidFiles?: string[];
};

/**
 * 파일 확장자 추출
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 파일 개수 검증
 */
export function validateFileCount(
  files: File[],
  maxCount: number,
  currentCount: number = 0
): FileValidationError | null {
  const totalCount = currentCount + files.length;

  if (totalCount > maxCount) {
    return {
      type: 'COUNT',
      message: `파일은 최대 ${maxCount}개까지 업로드할 수 있습니다. (현재: ${currentCount}개, 추가: ${files.length}개)`,
    };
  }

  return null;
}

/**
 * 파일 용량 검증 (장당)
 */
export function validateFileSize(
  files: File[],
  maxSizeMB: number
): FileValidationError | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const oversizedFiles: string[] = [];

  files.forEach((file) => {
    if (file.size > maxSizeBytes) {
      oversizedFiles.push(file.name);
    }
  });

  if (oversizedFiles.length > 0) {
    return {
      type: 'SIZE',
      message: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
      invalidFiles: oversizedFiles,
    };
  }

  return null;
}

/**
 * 파일 확장자 검증
 */
export function validateFileExtension(
  files: File[],
  allowedExtensions: readonly string[],
  allowedMimeTypes: readonly string[]
): FileValidationError | null {
  const invalidFiles: string[] = [];

  files.forEach((file) => {
    const extension = getFileExtension(file.name);
    const isValidExtension = allowedExtensions.includes(extension);
    const isValidMimeType = allowedMimeTypes.includes(file.type);

    if (!isValidExtension || !isValidMimeType) {
      invalidFiles.push(file.name);
    }
  });

  if (invalidFiles.length > 0) {
    const extensionList = allowedExtensions.join(', ');
    return {
      type: 'EXTENSION',
      message: `허용된 파일 형식이 아닙니다. (허용: ${extensionList})`,
      invalidFiles,
    };
  }

  return null;
}

/**
 * 쉬운 계약서 파일 검증
 */
export function validateEasyContractFiles(
  files: File[]
): FileValidationError | null {
  const { MAX_COUNT, MAX_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } =
    FILE_POLICIES.EASY_CONTRACT;

  // 1. 개수 검증
  const countError = validateFileCount(files, MAX_COUNT);
  if (countError) return countError;

  // 2. 용량 검증 (장당)
  const sizeError = validateFileSize(files, MAX_SIZE_MB);
  if (sizeError) return sizeError;

  // 3. 확장자 검증
  const extensionError = validateFileExtension(
    files,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES
  );
  if (extensionError) return extensionError;

  return null;
}

/**
 * 집 노트 파일 검증
 */
export function validateHomeNoteFiles(
  files: File[],
  currentFileCount: number = 0
): FileValidationError | null {
  const { MAX_COUNT, MAX_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } =
    FILE_POLICIES.HOME_NOTE;

  // 1. 개수 검증 (누적)
  const countError = validateFileCount(files, MAX_COUNT, currentFileCount);
  if (countError) return countError;

  // 2. 용량 검증 (장당)
  const sizeError = validateFileSize(files, MAX_SIZE_MB);
  if (sizeError) return sizeError;

  // 3. 확장자 검증
  const extensionError = validateFileExtension(
    files,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES
  );
  if (extensionError) return extensionError;

  return null;
}
