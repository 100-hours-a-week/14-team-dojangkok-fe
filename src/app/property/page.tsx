'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Header,
  FloatingAddButton,
  SearchBar,
  FilterChip,
  PropertyCard,
  StampBadge,
} from '@/components/common';
import type {
  PropertyPostSearchRequestDto,
  PropertyType,
  RentType,
} from '@/types/property';
import { PROPERTY_TYPE_MAP, RENT_TYPE_MAP } from '@/types/property';
import { getAllPropertyPosts, searchPropertyPosts } from '@/lib/api/property';
import { convertToPropertyList } from '@/utils/propertyAdapter';
import { usePropertyBookmark } from '@/hooks/usePropertyBookmark';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import styles from './property.module.css';

export default function PropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // 필터 활성 상태 - searchParams에서 직접 파생
  const keyword = searchParams.get('keyword') || '';
  const hasPropertyTypeFilter = !!searchParams.get('propertyTypes');
  const hasLeaseTypeFilter = !!searchParams.get('leaseTypes');
  const hasPriceFilter =
    searchParams.has('deposit') ||
    searchParams.has('rent') ||
    searchParams.has('purchasePrice');

  // URL 파라미터를 API 요청 형식으로 변환
  const buildSearchRequest =
    useCallback((): PropertyPostSearchRequestDto | null => {
      const keywordParam = searchParams.get('keyword') || '';
      const propertyTypesParam = searchParams.get('propertyTypes');
      const leaseTypesParam = searchParams.get('leaseTypes');
      const hasPrice =
        searchParams.has('deposit') ||
        searchParams.has('rent') ||
        searchParams.has('purchasePrice');

      const reviewedOnly = searchParams.get('reviewedOnly') === 'true';

      if (
        !keywordParam &&
        !propertyTypesParam &&
        !leaseTypesParam &&
        !hasPrice &&
        !reviewedOnly
      ) {
        return null;
      }

      const request: PropertyPostSearchRequestDto = {};

      if (keywordParam) {
        request.keyword = keywordParam;
      }

      if (reviewedOnly) {
        request.is_verified = true;
      }

      if (propertyTypesParam) {
        request.property_type = propertyTypesParam
          .split(',')
          .map((type) => PROPERTY_TYPE_MAP[type] as PropertyType)
          .filter(Boolean);
      }

      if (leaseTypesParam) {
        request.rent_type = leaseTypesParam
          .split(',')
          .map((type) => RENT_TYPE_MAP[type] as RentType)
          .filter(Boolean);
      }

      const deposit = searchParams.get('deposit');
      if (deposit) {
        const [min, max] = deposit.split('-').map(Number);
        if (min !== 0) request.deposit_min = min;
        if (max !== 20000) request.deposit_max = max;
      }

      const rent = searchParams.get('rent');
      if (rent) {
        const [min, max] = rent.split('-').map(Number);
        if (min !== 0) request.price_monthly_min = min;
        if (max !== 200) request.price_monthly_max = max;
      }

      const purchasePrice = searchParams.get('purchasePrice');
      if (purchasePrice) {
        const [min, max] = purchasePrice.split('-').map(Number);
        if (min !== 0) request.sale_price_min = min;
        if (max !== 100000) request.sale_price_max = max;
      }

      return request;
    }, [searchParams]);

  const fetchFn = useCallback(
    async (cursor?: string) => {
      if (!cursor) setTotalCount(null);
      const searchRequest = buildSearchRequest();

      if (searchRequest) {
        const response = await searchPropertyPosts(searchRequest, cursor);
        if (!cursor) setTotalCount(response.data.total_count);
        return {
          items: convertToPropertyList(response.data.items),
          hasNext: response.data.hasNext,
          nextCursor: response.data.next_cursor,
        };
      }

      const response = await getAllPropertyPosts(cursor);
      if (!cursor) setTotalCount(response.data.total_count);
      return {
        items: convertToPropertyList(response.data.property_post_items),
        hasNext: response.data.hasNext,
        nextCursor: response.data.next_cursor,
      };
    },
    [buildSearchRequest]
  );

  const {
    items: properties,
    isLoading: loading,
    isFetchingMore,
    error,
    hasNext,
    sentinelRef,
    setItems: setProperties,
    refetch,
  } = useInfiniteScroll(fetchFn, { resetKey: searchParams });

  const handlePropertyClick = (id: string) => {
    router.push(`/property/${id}`);
  };

  const { toggleBookmark } = usePropertyBookmark({
    onOptimisticUpdate: (propertyId, nextState) =>
      setProperties((prev) =>
        prev.map((p) =>
          p.id === String(propertyId) ? { ...p, isFavorite: nextState } : p
        )
      ),
    onRollback: (propertyId, prevState) =>
      setProperties((prev) =>
        prev.map((p) =>
          p.id === String(propertyId) ? { ...p, isFavorite: prevState } : p
        )
      ),
  });

  const handleFavoriteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const property = properties.find((p) => p.id === id);
    if (!property) return;
    toggleBookmark(Number(id), property.isFavorite);
  };

  const handleAddClick = () => {
    router.push('/property/create');
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleMyClick = () => {
    router.push('/property/my');
  };

  const handleSearchClick = () => {
    const currentParams = searchParams.toString();
    router.replace(
      `/property/search${currentParams ? `?${currentParams}` : ''}`
    );
  };

  const handleFilterClick = () => {
    const currentParams = searchParams.toString();
    router.replace(
      `/property/filter${currentParams ? `?${currentParams}` : ''}`
    );
  };

  const reviewedOnly = searchParams.get('reviewedOnly') === 'true';
  const filteredProperties = properties;

  return (
    <div className={styles.page}>
      <Header
        title="매물"
        showBackButton
        onBackClick={handleBackClick}
        rightText="MY"
        onRightClick={handleMyClick}
      />

      <div className={styles.searchSection}>
        <SearchBar
          placeholder="어떤 집을 찾으시나요?"
          value={keyword}
          onClick={handleSearchClick}
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {keyword && (
            <FilterChip
              active
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('keyword');
                router.replace(
                  `/property${params.toString() ? `?${params.toString()}` : ''}`
                );
              }}
            >
              검색어: {keyword}
            </FilterChip>
          )}
          <FilterChip
            active={reviewedOnly}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (reviewedOnly) {
                params.delete('reviewedOnly');
              } else {
                params.set('reviewedOnly', 'true');
              }
              router.replace(
                `/property${params.toString() ? `?${params.toString()}` : ''}`
              );
            }}
            badge={<StampBadge size="small" />}
          >
            검토 완료
          </FilterChip>
          <FilterChip
            showDropdown
            onClick={handleFilterClick}
            active={hasPropertyTypeFilter}
          >
            매물 유형
          </FilterChip>
          <FilterChip
            showDropdown
            onClick={handleFilterClick}
            active={hasLeaseTypeFilter}
          >
            임대 형태
          </FilterChip>
          <FilterChip
            showDropdown
            onClick={handleFilterClick}
            active={hasPriceFilter}
          >
            가격
          </FilterChip>
        </div>
      </div>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>매물을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>매물을 불러오는데 실패했습니다.</p>
            <button onClick={refetch}>다시 시도</button>
          </div>
        ) : filteredProperties.length > 0 ? (
          <>
            {totalCount !== null && (
              <p className={styles.totalCount}>총 {totalCount}개</p>
            )}
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={handlePropertyClick}
                onFavoriteClick={handleFavoriteClick}
              />
            ))}
            {isFetchingMore && (
              <div className={styles.loadingMore}>불러오는 중...</div>
            )}
            {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>매물이 없습니다</p>
          </div>
        )}
      </main>

      <FloatingAddButton onClick={handleAddClick} />
    </div>
  );
}
