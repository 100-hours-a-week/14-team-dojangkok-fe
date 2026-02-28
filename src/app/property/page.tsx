'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Header,
  FloatingAddButton,
  SearchBar,
  FilterChip,
  PropertyCard,
  StampBadge,
} from '@/components/common';
import { Property } from '@/types/property';
import type {
  PropertyPostSearchRequestDto,
  PropertyType,
  RentType,
} from '@/types/property';
import { PROPERTY_TYPE_MAP, RENT_TYPE_MAP } from '@/types/property';
import { getAllPropertyPosts, searchPropertyPosts } from '@/lib/api/property';
import { convertToPropertyList } from '@/utils/propertyAdapter';
import styles from './property.module.css';

export default function PropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 필터 활성 상태
  const [hasPropertyTypeFilter, setHasPropertyTypeFilter] = useState(false);
  const [hasLeaseTypeFilter, setHasLeaseTypeFilter] = useState(false);
  const [hasPriceFilter, setHasPriceFilter] = useState(false);

  // URL 파라미터를 API 요청 형식으로 변환
  const buildSearchRequest = useCallback((): PropertyPostSearchRequestDto | null => {
    const keywordParam = searchParams.get('keyword') || '';
    const propertyTypesParam = searchParams.get('propertyTypes');
    const leaseTypesParam = searchParams.get('leaseTypes');
    const hasPrice =
      searchParams.has('monthlyDeposit') ||
      searchParams.has('monthlyRent') ||
      searchParams.has('jeonsaeDeposit') ||
      searchParams.has('semiJeonsaeDeposit') ||
      searchParams.has('semiJeonsaeRent') ||
      searchParams.has('purchasePrice');

    const reviewedOnly = searchParams.get('reviewedOnly') === 'true';

    if (!keywordParam && !propertyTypesParam && !leaseTypesParam && !hasPrice && !reviewedOnly) {
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

    const monthlyDeposit = searchParams.get('monthlyDeposit');
    const monthlyRent = searchParams.get('monthlyRent');
    if (monthlyDeposit) {
      const [min, max] = monthlyDeposit.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }
    if (monthlyRent) {
      const [min, max] = monthlyRent.split('-').map(Number);
      request.price_monthly_min = min;
      request.price_monthly_max = max;
    }

    const jeonsaeDeposit = searchParams.get('jeonsaeDeposit');
    if (jeonsaeDeposit) {
      const [min, max] = jeonsaeDeposit.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }

    const semiJeonsaeDeposit = searchParams.get('semiJeonsaeDeposit');
    const semiJeonsaeRent = searchParams.get('semiJeonsaeRent');
    if (semiJeonsaeDeposit) {
      const [min, max] = semiJeonsaeDeposit.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }
    if (semiJeonsaeRent) {
      const [min, max] = semiJeonsaeRent.split('-').map(Number);
      request.price_monthly_min = min;
      request.price_monthly_max = max;
    }

    const purchasePrice = searchParams.get('purchasePrice');
    if (purchasePrice) {
      const [min, max] = purchasePrice.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }

    return request;
  }, [searchParams]);

  const fetchProperties = useCallback(
    async (cursor?: string) => {
      if (loadingRef.current && cursor) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const searchRequest = buildSearchRequest();

        if (searchRequest) {
          const response = await searchPropertyPosts(searchRequest, cursor);
          const convertedProperties = convertToPropertyList(response.data.items);
          setProperties((prev) =>
            cursor ? [...prev, ...convertedProperties] : convertedProperties
          );
          if (!cursor) setTotalCount(response.data.total_count);
          setNextCursor(response.data.next_cursor);
          setHasNext(response.data.hasNext);
        } else {
          const response = await getAllPropertyPosts(cursor);
          const convertedProperties = convertToPropertyList(
            response.data.property_post_items
          );
          setProperties((prev) =>
            cursor ? [...prev, ...convertedProperties] : convertedProperties
          );
          if (!cursor) setTotalCount(response.data.total_count);
          setNextCursor(response.data.next_cursor);
          setHasNext(response.data.hasNext);
        }
      } catch {
        setError('매물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [buildSearchRequest]
  );

  // 무한 스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingRef.current) {
          fetchProperties(nextCursor ?? undefined);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, nextCursor, fetchProperties]);

  // URL 쿼리 파라미터 변경 시 목록 새로고침
  useEffect(() => {
    const propertyTypes = searchParams.get('propertyTypes');
    const leaseTypes = searchParams.get('leaseTypes');
    const hasPrice =
      searchParams.has('monthlyDeposit') ||
      searchParams.has('monthlyRent') ||
      searchParams.has('jeonsaeDeposit') ||
      searchParams.has('semiJeonsaeDeposit') ||
      searchParams.has('semiJeonsaeRent') ||
      searchParams.has('purchasePrice');

    setKeyword(searchParams.get('keyword') || '');
    setHasPropertyTypeFilter(!!propertyTypes);
    setHasLeaseTypeFilter(!!leaseTypes);
    setHasPriceFilter(hasPrice);

    setProperties([]);
    setTotalCount(null);
    setNextCursor(null);
    setHasNext(false);

    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePropertyClick = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleFavoriteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
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
    router.replace(`/property/search${currentParams ? `?${currentParams}` : ''}`);
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
                router.replace(`/property${params.toString() ? `?${params.toString()}` : ''}`);
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
              router.replace(`/property${params.toString() ? `?${params.toString()}` : ''}`);
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
        {loading && properties.length === 0 ? (
          <div className={styles.loadingState}>
            <p>매물을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => fetchProperties()}>다시 시도</button>
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
            {loading && (
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
