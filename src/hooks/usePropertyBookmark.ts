'use client';

import { useToast } from '@/contexts/ToastContext';
import { addBookmark, removeBookmark } from '@/lib/api/property';

interface UsePropertyBookmarkProps {
  onOptimisticUpdate?: (id: number, newState: boolean) => void;
  onRollback?: (id: number, prevState: boolean) => void;
  onSuccess?: (id: number, newState: boolean) => void;
}

export function usePropertyBookmark(props?: UsePropertyBookmarkProps) {
  const { success, error: showError } = useToast();
  const { onOptimisticUpdate, onRollback, onSuccess } = props || {};

  const toggleBookmark = async (
    propertyId: number,
    isCurrentlyBookmarked: boolean
  ) => {
    const nextState = !isCurrentlyBookmarked;

    // 1. 낙관적 업데이트 실행
    onOptimisticUpdate?.(propertyId, nextState);

    try {
      // 2. API 호출
      if (isCurrentlyBookmarked) {
        await removeBookmark(propertyId);
        success('스크랩이 해제되었습니다.');
      } else {
        await addBookmark(propertyId);
        success('스크랩되었습니다.');
      }

      // 3. 성공 콜백
      onSuccess?.(propertyId, nextState);
    } catch (error) {
      // 4. 에러 발생 시 롤백 및 알림
      onRollback?.(propertyId, isCurrentlyBookmarked);
      showError('스크랩 처리에 실패했습니다.');
      console.error('Bookmark toggle error:', error);
    }
  };

  return { toggleBookmark };
}
