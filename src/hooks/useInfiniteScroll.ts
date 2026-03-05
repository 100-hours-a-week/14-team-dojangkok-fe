'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
  RefObject,
} from 'react';

export interface PaginatedData<T> {
  items: T[];
  hasNext: boolean;
  nextCursor: string | null;
}

interface UseInfiniteScrollOptions {
  resetKey?: unknown;
  threshold?: number;
}

export interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  hasNext: boolean;
  sentinelRef: RefObject<HTMLDivElement>;
  setItems: Dispatch<SetStateAction<T[]>>;
  refetch: () => void;
}

export function useInfiniteScroll<T>(
  fetchFn: (cursor?: string) => Promise<PaginatedData<T>>,
  options?: UseInfiniteScrollOptions
): UseInfiniteScrollReturn<T> {
  const { resetKey, threshold = 0.1 } = options ?? {};

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchFnRef = useRef(fetchFn);

  // Keep fetchFnRef up to date with the latest fetchFn (runs after every render)
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  const fetchInitial = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current(undefined);
      setItems(result.items);
      setHasNext(result.hasNext);
      setNextCursor(result.nextCursor);
    } catch {
      setError('불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const fetchMore = useCallback(async (cursor: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsFetchingMore(true);
    try {
      const result = await fetchFnRef.current(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setHasNext(result.hasNext);
      setNextCursor(result.nextCursor);
    } catch {
      // 추가 페이지 로드 실패는 조용히 처리
    } finally {
      setIsFetchingMore(false);
      loadingRef.current = false;
    }
  }, []);

  // resetKey 변경 시 초기화 후 재조회 (초기 마운트 포함)
  useEffect(() => {
    setItems([]);
    setHasNext(false);
    setNextCursor(null);
    setError(null);
    fetchInitial();
  }, [resetKey, fetchInitial]);

  // IntersectionObserver 무한 스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNext &&
          !loadingRef.current &&
          nextCursor
        ) {
          fetchMore(nextCursor);
        }
      },
      { threshold }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, nextCursor, fetchMore, threshold]);

  const refetch = useCallback(() => {
    setItems([]);
    setHasNext(false);
    setNextCursor(null);
    setError(null);
    fetchInitial();
  }, [fetchInitial]);

  return {
    items,
    isLoading,
    isFetchingMore,
    error,
    hasNext,
    sentinelRef: sentinelRef as RefObject<HTMLDivElement>,
    setItems,
    refetch,
  };
}
