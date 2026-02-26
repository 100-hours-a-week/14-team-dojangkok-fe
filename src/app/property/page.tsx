'use client';

import { useState, useEffect } from 'react';
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
  const [showReviewedOnly, setShowReviewedOnly] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  // 필터 활성 상태
  const [hasPropertyTypeFilter, setHasPropertyTypeFilter] = useState(false);
  const [hasLeaseTypeFilter, setHasLeaseTypeFilter] = useState(false);
  const [hasPriceFilter, setHasPriceFilter] = useState(false);

  // URL 파라미터를 API 요청 형식으로 변환
  const buildSearchRequest = (): PropertyPostSearchRequestDto | null => {
    const propertyTypesParam = searchParams.get('propertyTypes');
    const leaseTypesParam = searchParams.get('leaseTypes');

    // 필터가 하나도 없으면 null 반환
    if (!propertyTypesParam && !leaseTypesParam && !hasPriceFilter) {
      return null;
    }

    const request: PropertyPostSearchRequestDto = {};

    // 매물 유형
    if (propertyTypesParam) {
      request.property_type = propertyTypesParam
        .split(',')
        .map((type) => PROPERTY_TYPE_MAP[type] as PropertyType)
        .filter(Boolean);
    }

    // 임대 형태
    if (leaseTypesParam) {
      request.rent_type = leaseTypesParam
        .split(',')
        .map((type) => RENT_TYPE_MAP[type] as RentType)
        .filter(Boolean);
    }

    // 가격 필터 (월세)
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

    // 가격 필터 (전세)
    const jeonsaeDeposit = searchParams.get('jeonsaeDeposit');
    if (jeonsaeDeposit) {
      const [min, max] = jeonsaeDeposit.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }

    // 가격 필터 (반전세)
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

    // 가격 필터 (매매)
    const purchasePrice = searchParams.get('purchasePrice');
    if (purchasePrice) {
      const [min, max] = purchasePrice.split('-').map(Number);
      request.price_main_min = min;
      request.price_main_max = max;
    }

    return request;
  };

  // 매물 목록 API 호출
  const fetchProperties = async (cursor?: string) => {
    setLoading(true);
    setError(null);

    try {
      const searchRequest = buildSearchRequest();

      if (searchRequest) {
        // 필터가 있으면 검색 API 사용
        const response = await searchPropertyPosts(searchRequest, cursor);
        const convertedProperties = convertToPropertyList(
          response.data.items
        );

        setProperties((prev) =>
          cursor ? [...prev, ...convertedProperties] : convertedProperties
        );
        setNextCursor(response.data.next_cursor);
        setHasNext(response.data.hasNext);
      } else {
        // 필터가 없으면 전체 목록 API 사용
        const response = await getAllPropertyPosts(cursor);
        const convertedProperties = convertToPropertyList(
          response.data.property_post_items
        );

        setProperties((prev) =>
          cursor ? [...prev, ...convertedProperties] : convertedProperties
        );
        setNextCursor(response.data.next_cursor);
        setHasNext(response.data.hasNext);
      }
    } catch (err) {
      setError('매물을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 더보기 버튼 클릭
  const handleLoadMore = () => {
    if (nextCursor && hasNext && !loading) {
      fetchProperties(nextCursor);
    }
  };

  // URL 쿼리 파라미터 변경 시 목록 새로고침
  useEffect(() => {
    const reviewedOnly = searchParams.get('reviewedOnly') === 'true';
    const propertyTypes = searchParams.get('propertyTypes');
    const leaseTypes = searchParams.get('leaseTypes');
    const hasPrice =
      searchParams.has('monthlyDeposit') ||
      searchParams.has('monthlyRent') ||
      searchParams.has('jeonsaeDeposit') ||
      searchParams.has('semiJeonsaeDeposit') ||
      searchParams.has('semiJeonsaeRent') ||
      searchParams.has('purchasePrice');

    setShowReviewedOnly(reviewedOnly);
    setHasPropertyTypeFilter(!!propertyTypes);
    setHasLeaseTypeFilter(!!leaseTypes);
    setHasPriceFilter(hasPrice);

    // API 호출
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
    router.push('/property/search');
  };

  const handleFilterClick = () => {
    const currentParams = searchParams.toString();
    router.push(
      `/property/filter${currentParams ? `?${currentParams}` : ''}`
    );
  };

  const filteredProperties = showReviewedOnly
    ? properties.filter((property) => property.isReviewed)
    : properties;

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
          onClick={handleSearchClick}
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          <FilterChip
            active={showReviewedOnly}
            onClick={() => setShowReviewedOnly(!showReviewedOnly)}
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
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={handlePropertyClick}
                onFavoriteClick={handleFavoriteClick}
              />
            ))}
            {hasNext && (
              <button
                className={styles.loadMoreButton}
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더보기'}
              </button>
            )}
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
