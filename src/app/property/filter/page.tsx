'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, StampBadge, RangeSlider } from '@/components/common';
import { getSearchCount } from '@/lib/api/property';
import type {
  PropertyPostSearchRequestDto,
  PropertyType,
  RentType,
} from '@/types/property';
import { PROPERTY_TYPE_MAP, RENT_TYPE_MAP } from '@/types/property';
import styles from './filter.module.css';

const PROPERTY_TYPES = [
  '원룸',
  '투룸 이상',
  '오피스텔',
  '아파트',
  '상가',
  '주택',
];
const LEASE_TYPES = ['월세', '전세', '반전세', '매매'];

// 보증금이 적용되는 임대 형태
const DEPOSIT_TYPES = ['월세', '전세', '반전세'];
// 월세가 적용되는 임대 형태
const RENT_TYPES = ['월세', '반전세'];

const formatDeposit = (val: number) => {
  if (val === 20000) return '2억 이상';
  if (val === 0) return '0원';
  if (val >= 10000)
    return `${Math.floor(val / 10000)}억${val % 10000 > 0 ? ` ${val % 10000}만` : ''}원`;
  return `${val}만원`;
};

const formatRent = (val: number) => {
  if (val === 200) return '200만원 이상';
  if (val === 0) return '0원';
  return `${val}만원`;
};

const formatPurchasePrice = (val: number) => {
  if (val === 100000) return '10억 이상';
  if (val === 0) return '0원';
  if (val >= 10000)
    return `${Math.floor(val / 10000)}억${val % 10000 > 0 ? ` ${val % 10000}만` : ''}원`;
  return `${val}만원`;
};

export default function PropertyFilterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 읽기
  const getInitialReviewedOnly = () =>
    searchParams.get('reviewedOnly') === 'true';
  const getInitialPropertyTypes = () => {
    const types = searchParams.get('propertyTypes');
    return types ? types.split(',') : [];
  };
  const getInitialLeaseTypes = () => {
    const types = searchParams.get('leaseTypes');
    return types ? types.split(',') : [];
  };
  const parseRangeParam = (
    param: string | null,
    defaultRange: [number, number]
  ): [number, number] => {
    if (!param) return defaultRange;
    const [min, max] = param.split('-').map(Number);
    return [min, max];
  };

  const [reviewedOnly, setReviewedOnly] = useState(getInitialReviewedOnly());
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    getInitialPropertyTypes()
  );
  const [leaseTypes, setLeaseTypes] = useState<string[]>(
    getInitialLeaseTypes()
  );

  // 통합 가격 범위 슬라이더
  const [depositRange, setDepositRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('deposit'), [0, 20000])
  );
  const [rentRange, setRentRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('rent'), [0, 200])
  );
  const [purchasePriceRange, setPurchasePriceRange] = useState<
    [number, number]
  >(parseRangeParam(searchParams.get('purchasePrice'), [0, 100000]));

  const priceRef = useRef<HTMLDivElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const isResettingRef = useRef(false);
  const prevLeaseTypesRef = useRef<string[]>([]);
  const isInitialMountRef = useRef(true);

  const buildCountRequest = useCallback((): PropertyPostSearchRequestDto => {
    const request: PropertyPostSearchRequestDto = {};

    const keyword = searchParams.get('keyword');
    if (keyword) request.keyword = keyword;

    if (propertyTypes.length > 0) {
      request.property_type = propertyTypes
        .map((t) => PROPERTY_TYPE_MAP[t] as PropertyType)
        .filter(Boolean);
    }

    if (leaseTypes.length > 0) {
      request.rent_type = leaseTypes
        .map((t) => RENT_TYPE_MAP[t] as RentType)
        .filter(Boolean);
    }

    const hasDepositType = leaseTypes.some((t) => DEPOSIT_TYPES.includes(t));
    const hasRentType = leaseTypes.some((t) => RENT_TYPES.includes(t));

    if (
      hasDepositType &&
      (depositRange[0] !== 0 || depositRange[1] !== 20000)
    ) {
      if (depositRange[0] !== 0) request.deposit_min = depositRange[0];
      if (depositRange[1] !== 20000) request.deposit_max = depositRange[1];
    }
    if (hasRentType && (rentRange[0] !== 0 || rentRange[1] !== 200)) {
      if (rentRange[0] !== 0) request.price_monthly_min = rentRange[0];
      if (rentRange[1] !== 200) request.price_monthly_max = rentRange[1];
    }
    if (
      leaseTypes.includes('매매') &&
      (purchasePriceRange[0] !== 0 || purchasePriceRange[1] !== 100000)
    ) {
      if (purchasePriceRange[0] !== 0)
        request.sale_price_min = purchasePriceRange[0];
      if (purchasePriceRange[1] !== 100000)
        request.sale_price_max = purchasePriceRange[1];
    }

    if (reviewedOnly) {
      request.is_verified = true;
    }

    return request;
  }, [
    searchParams,
    propertyTypes,
    leaseTypes,
    depositRange,
    rentRange,
    purchasePriceRange,
    reviewedOnly,
  ]);

  // 필터 변경 시 debounce 카운트 조회
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (isResettingRef.current) {
      isResettingRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    const hasActiveFilters =
      !!searchParams.get('keyword') ||
      propertyTypes.length > 0 ||
      leaseTypes.length > 0;

    if (!hasActiveFilters) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(null);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await getSearchCount(buildCountRequest());
        setCount(response.data.count);
      } catch {
        setCount(null);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [buildCountRequest, searchParams, propertyTypes, leaseTypes]);

  // 임대 형태 추가 시 가격 섹션으로 스크롤
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevLeaseTypesRef.current = leaseTypes;
      return;
    }

    const prevLeaseTypes = prevLeaseTypesRef.current;
    const newLeaseTypes = leaseTypes.filter(
      (type) => !prevLeaseTypes.includes(type)
    );

    if (newLeaseTypes.length > 0 && priceRef.current) {
      setTimeout(() => {
        priceRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }

    prevLeaseTypesRef.current = leaseTypes;
  }, [leaseTypes]);

  const handleBackClick = () => {
    const params = searchParams.toString();
    router.replace(`/property${params ? `?${params}` : ''}`);
  };

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLeaseType = (type: string) => {
    setLeaseTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleReset = () => {
    isResettingRef.current = true;
    setCount(null);
    setReviewedOnly(false);
    setPropertyTypes([]);
    setLeaseTypes([]);
    setDepositRange([0, 20000]);
    setRentRange([0, 200]);
    setPurchasePriceRange([0, 100000]);
  };

  const handleApply = () => {
    const params = new URLSearchParams();

    if (reviewedOnly) {
      params.set('reviewedOnly', 'true');
    }

    if (propertyTypes.length > 0) {
      params.set('propertyTypes', propertyTypes.join(','));
    }

    if (leaseTypes.length > 0) {
      params.set('leaseTypes', leaseTypes.join(','));
    }

    const hasDepositType = leaseTypes.some((t) => DEPOSIT_TYPES.includes(t));
    const hasRentType = leaseTypes.some((t) => RENT_TYPES.includes(t));

    if (
      hasDepositType &&
      (depositRange[0] !== 0 || depositRange[1] !== 20000)
    ) {
      params.set('deposit', `${depositRange[0]}-${depositRange[1]}`);
    }
    if (hasRentType && (rentRange[0] !== 0 || rentRange[1] !== 200)) {
      params.set('rent', `${rentRange[0]}-${rentRange[1]}`);
    }
    if (
      leaseTypes.includes('매매') &&
      (purchasePriceRange[0] !== 0 || purchasePriceRange[1] !== 100000)
    ) {
      params.set(
        'purchasePrice',
        `${purchasePriceRange[0]}-${purchasePriceRange[1]}`
      );
    }

    const keyword = searchParams.get('keyword');
    if (keyword) {
      params.set('keyword', keyword);
    }

    router.replace(`/property?${params.toString()}`);
  };

  const hasDepositType = leaseTypes.some((t) => DEPOSIT_TYPES.includes(t));
  const hasRentType = leaseTypes.some((t) => RENT_TYPES.includes(t));

  return (
    <div className={styles.page}>
      <Header title="필터" showBackButton onBackClick={handleBackClick} />

      <main className={styles.main}>
        {/* 계약서 검토 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>계약서 검토</h2>
          <div className={styles.chipGroup}>
            <button
              className={`${styles.chip} ${reviewedOnly ? styles.chipActive : ''}`}
              onClick={() => setReviewedOnly(!reviewedOnly)}
            >
              <span>검토 완료 매물만</span>
              <span className={styles.badge}>
                <StampBadge size="small" />
              </span>
            </button>
          </div>
        </section>

        {/* 매물 유형 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>매물 유형</h2>
          <div className={styles.chipGroup}>
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                className={`${styles.chip} ${
                  propertyTypes.includes(type) ? styles.chipActive : ''
                }`}
                onClick={() => togglePropertyType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* 임대 형태 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>임대 형태</h2>
          <div className={styles.chipGroup}>
            {LEASE_TYPES.map((type) => (
              <button
                key={type}
                className={`${styles.chip} ${
                  leaseTypes.includes(type) ? styles.chipActive : ''
                }`}
                onClick={() => toggleLeaseType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* 가격 */}
        {leaseTypes.length === 0 ? (
          <section className={`${styles.section} ${styles.sectionDisabled}`}>
            <h2 className={styles.sectionTitle}>가격</h2>
            <div className={styles.priceHeader}>
              <h3 className={styles.subTitle}>보증금</h3>
              <span className={styles.priceValue}>전체</span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={20000}
                step={100}
                value={[0, 20000]}
                onChange={() => {}}
                disabled
              />
            </div>
            <p className={styles.disabledHint}>
              <span className="material-symbols-outlined">info</span>
              임대 형태를 선택하면 활성화됩니다
            </p>
          </section>
        ) : (
          <section ref={priceRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>가격</h2>

            {/* 보증금: 전세/월세/반전세 */}
            {hasDepositType && (
              <>
                <div className={styles.priceHeader}>
                  <h3 className={styles.subTitle}>보증금</h3>
                  <span className={styles.priceValue}>
                    {depositRange[0] === 0 && depositRange[1] === 20000
                      ? '전체'
                      : `${formatDeposit(depositRange[0])} ~ ${formatDeposit(depositRange[1])}`}
                  </span>
                </div>
                <div className={styles.sliderWrapper}>
                  <RangeSlider
                    min={0}
                    max={20000}
                    step={100}
                    value={depositRange}
                    onChange={setDepositRange}
                  />
                </div>
              </>
            )}

            {/* 월세: 월세/반전세 */}
            {hasRentType && (
              <>
                <div
                  className={styles.priceHeader}
                  style={{ marginTop: hasDepositType ? '24px' : '0' }}
                >
                  <h3 className={styles.subTitle}>월세</h3>
                  <span className={styles.priceValue}>
                    {rentRange[0] === 0 && rentRange[1] === 200
                      ? '전체'
                      : `${formatRent(rentRange[0])} ~ ${formatRent(rentRange[1])}`}
                  </span>
                </div>
                <div className={styles.sliderWrapper}>
                  <RangeSlider
                    min={0}
                    max={200}
                    step={5}
                    value={rentRange}
                    onChange={setRentRange}
                  />
                </div>
              </>
            )}

            {/* 매매가: 매매 */}
            {leaseTypes.includes('매매') && (
              <>
                <div
                  className={styles.priceHeader}
                  style={{
                    marginTop: hasDepositType || hasRentType ? '24px' : '0',
                  }}
                >
                  <h3 className={styles.subTitle}>매매가</h3>
                  <span className={styles.priceValue}>
                    {purchasePriceRange[0] === 0 &&
                    purchasePriceRange[1] === 100000
                      ? '전체'
                      : `${formatPurchasePrice(purchasePriceRange[0])} ~ ${formatPurchasePrice(purchasePriceRange[1])}`}
                  </span>
                </div>
                <div className={styles.sliderWrapper}>
                  <RangeSlider
                    min={0}
                    max={100000}
                    step={1000}
                    value={purchasePriceRange}
                    onChange={setPurchasePriceRange}
                  />
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* 하단 버튼 영역 */}
      <footer className={styles.footer}>
        <button className={styles.resetButton} onClick={handleReset}>
          <span className="material-symbols-outlined">restart_alt</span>
          초기화
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          {count === null ? '전체 보기' : `${count}개 매물 보기`}
        </button>
      </footer>
    </div>
  );
}
