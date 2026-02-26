'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, StampBadge, RangeSlider } from '@/components/common';
import styles from './filter.module.css';

const PROPERTY_TYPES = ['원룸', '투룸 이상', '오피스텔', '아파트', '상가', '주택'];
const LEASE_TYPES = ['월세', '전세', '반전세', '매매'];

const formatDeposit = (val: number) => {
  if (val === 20000) return '2억 이상';
  if (val === 0) return '0원';
  if (val >= 10000) return `${Math.floor(val / 10000)}억${val % 10000 > 0 ? ` ${val % 10000}만` : ''}원`;
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
  if (val >= 10000) return `${Math.floor(val / 10000)}억${val % 10000 > 0 ? ` ${val % 10000}만` : ''}원`;
  return `${val}만원`;
};

export default function PropertyFilterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 읽기
  const getInitialReviewedOnly = () => searchParams.get('reviewedOnly') === 'true';
  const getInitialPropertyTypes = () => {
    const types = searchParams.get('propertyTypes');
    return types ? types.split(',') : [];
  };
  const getInitialLeaseTypes = () => {
    const types = searchParams.get('leaseTypes');
    return types ? types.split(',') : [];
  };
  const parseRangeParam = (param: string | null, defaultRange: [number, number]): [number, number] => {
    if (!param) return defaultRange;
    const [min, max] = param.split('-').map(Number);
    return [min, max];
  };

  const [reviewedOnly, setReviewedOnly] = useState(getInitialReviewedOnly());
  const [propertyTypes, setPropertyTypes] = useState<string[]>(getInitialPropertyTypes());
  const [leaseTypes, setLeaseTypes] = useState<string[]>(getInitialLeaseTypes());

  // 각 임대 형태별 가격 범위
  const [monthlyDepositRange, setMonthlyDepositRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('monthlyDeposit'), [0, 20000])
  );
  const [monthlyRentRange, setMonthlyRentRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('monthlyRent'), [0, 200])
  );
  const [jeonsaeDepositRange, setJeonsaeDepositRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('jeonsaeDeposit'), [0, 20000])
  );
  const [semiJeonsaeDepositRange, setSemiJeonsaeDepositRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('semiJeonsaeDeposit'), [0, 20000])
  );
  const [semiJeonsaeRentRange, setSemiJeonsaeRentRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('semiJeonsaeRent'), [0, 200])
  );
  const [purchasePriceRange, setPurchasePriceRange] = useState<[number, number]>(
    parseRangeParam(searchParams.get('purchasePrice'), [0, 100000])
  );

  // 각 임대 형태 섹션에 대한 ref
  const monthlyRef = useRef<HTMLDivElement>(null);
  const jeonsaeRef = useRef<HTMLDivElement>(null);
  const semiJeonsaeRef = useRef<HTMLDivElement>(null);
  const purchaseRef = useRef<HTMLDivElement>(null);

  // 이전 leaseTypes 추적
  const prevLeaseTypesRef = useRef<string[]>([]);

  // 초기 마운트 여부 추적
  const isInitialMountRef = useRef(true);

  // 임대 형태 변경 시 스크롤
  useEffect(() => {
    // 초기 로딩 시에는 스크롤하지 않음
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevLeaseTypesRef.current = leaseTypes;
      return;
    }

    const prevLeaseTypes = prevLeaseTypesRef.current;
    const newLeaseTypes = leaseTypes.filter(
      (type) => !prevLeaseTypes.includes(type)
    );

    if (newLeaseTypes.length > 0) {
      // 새로 추가된 임대 형태 중 마지막 항목으로 스크롤
      const newType = newLeaseTypes[newLeaseTypes.length - 1];
      let targetRef: React.RefObject<HTMLDivElement> | null = null;

      switch (newType) {
        case '월세':
          targetRef = monthlyRef;
          break;
        case '전세':
          targetRef = jeonsaeRef;
          break;
        case '반전세':
          targetRef = semiJeonsaeRef;
          break;
        case '매매':
          targetRef = purchaseRef;
          break;
      }

      if (targetRef?.current) {
        setTimeout(() => {
          targetRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }
    }

    prevLeaseTypesRef.current = leaseTypes;
  }, [leaseTypes]);

  const handleBackClick = () => {
    router.back();
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
    setReviewedOnly(false);
    setPropertyTypes([]);
    setLeaseTypes([]);
    setMonthlyDepositRange([0, 20000]);
    setMonthlyRentRange([0, 200]);
    setJeonsaeDepositRange([0, 20000]);
    setSemiJeonsaeDepositRange([0, 20000]);
    setSemiJeonsaeRentRange([0, 200]);
    setPurchasePriceRange([0, 100000]);
  };

  const handleApply = () => {
    // 쿼리 파라미터 생성
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

    // 가격 필터 추가 (기본값이 아닌 경우만)
    if (leaseTypes.includes('월세')) {
      if (monthlyDepositRange[0] !== 0 || monthlyDepositRange[1] !== 20000) {
        params.set('monthlyDeposit', `${monthlyDepositRange[0]}-${monthlyDepositRange[1]}`);
      }
      if (monthlyRentRange[0] !== 0 || monthlyRentRange[1] !== 200) {
        params.set('monthlyRent', `${monthlyRentRange[0]}-${monthlyRentRange[1]}`);
      }
    }

    if (leaseTypes.includes('전세')) {
      if (jeonsaeDepositRange[0] !== 0 || jeonsaeDepositRange[1] !== 20000) {
        params.set('jeonsaeDeposit', `${jeonsaeDepositRange[0]}-${jeonsaeDepositRange[1]}`);
      }
    }

    if (leaseTypes.includes('반전세')) {
      if (semiJeonsaeDepositRange[0] !== 0 || semiJeonsaeDepositRange[1] !== 20000) {
        params.set('semiJeonsaeDeposit', `${semiJeonsaeDepositRange[0]}-${semiJeonsaeDepositRange[1]}`);
      }
      if (semiJeonsaeRentRange[0] !== 0 || semiJeonsaeRentRange[1] !== 200) {
        params.set('semiJeonsaeRent', `${semiJeonsaeRentRange[0]}-${semiJeonsaeRentRange[1]}`);
      }
    }

    if (leaseTypes.includes('매매')) {
      if (purchasePriceRange[0] !== 0 || purchasePriceRange[1] !== 100000) {
        params.set('purchasePrice', `${purchasePriceRange[0]}-${purchasePriceRange[1]}`);
      }
    }

    // router.replace를 사용하여 필터 페이지를 히스토리에서 제거
    router.replace(`/property?${params.toString()}`);
  };

  const getTotalCount = () => {
    // Mock count - replace with actual filtered count
    return 30;
  };

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

        {/* 월세 */}
        {leaseTypes.includes('월세') && (
          <section ref={monthlyRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>월세</h2>

            <div className={styles.priceHeader}>
              <h3 className={styles.subTitle}>보증금</h3>
              <span className={styles.priceValue}>
                {monthlyDepositRange[0] === 0 && monthlyDepositRange[1] === 20000
                  ? '전체'
                  : `${formatDeposit(monthlyDepositRange[0])} ~ ${formatDeposit(monthlyDepositRange[1])}`}
              </span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={20000}
                step={100}
                value={monthlyDepositRange}
                onChange={setMonthlyDepositRange}
              />
            </div>

            <div className={styles.priceHeader} style={{ marginTop: '24px' }}>
              <h3 className={styles.subTitle}>월세</h3>
              <span className={styles.priceValue}>
                {monthlyRentRange[0] === 0 && monthlyRentRange[1] === 200
                  ? '전체'
                  : `${formatRent(monthlyRentRange[0])} ~ ${formatRent(monthlyRentRange[1])}`}
              </span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={200}
                step={5}
                value={monthlyRentRange}
                onChange={setMonthlyRentRange}
              />
            </div>
          </section>
        )}

        {/* 전세 */}
        {leaseTypes.includes('전세') && (
          <section ref={jeonsaeRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>전세</h2>

            <div className={styles.priceHeader}>
              <h3 className={styles.subTitle}>보증금</h3>
              <span className={styles.priceValue}>
                {jeonsaeDepositRange[0] === 0 && jeonsaeDepositRange[1] === 20000
                  ? '전체'
                  : `${formatDeposit(jeonsaeDepositRange[0])} ~ ${formatDeposit(jeonsaeDepositRange[1])}`}
              </span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={20000}
                step={100}
                value={jeonsaeDepositRange}
                onChange={setJeonsaeDepositRange}
              />
            </div>
          </section>
        )}

        {/* 반전세 */}
        {leaseTypes.includes('반전세') && (
          <section ref={semiJeonsaeRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>반전세</h2>

            <div className={styles.priceHeader}>
              <h3 className={styles.subTitle}>보증금</h3>
              <span className={styles.priceValue}>
                {semiJeonsaeDepositRange[0] === 0 && semiJeonsaeDepositRange[1] === 20000
                  ? '전체'
                  : `${formatDeposit(semiJeonsaeDepositRange[0])} ~ ${formatDeposit(semiJeonsaeDepositRange[1])}`}
              </span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={20000}
                step={100}
                value={semiJeonsaeDepositRange}
                onChange={setSemiJeonsaeDepositRange}
              />
            </div>

            <div className={styles.priceHeader} style={{ marginTop: '24px' }}>
              <h3 className={styles.subTitle}>월세</h3>
              <span className={styles.priceValue}>
                {semiJeonsaeRentRange[0] === 0 && semiJeonsaeRentRange[1] === 200
                  ? '전체'
                  : `${formatRent(semiJeonsaeRentRange[0])} ~ ${formatRent(semiJeonsaeRentRange[1])}`}
              </span>
            </div>
            <div className={styles.sliderWrapper}>
              <RangeSlider
                min={0}
                max={200}
                step={5}
                value={semiJeonsaeRentRange}
                onChange={setSemiJeonsaeRentRange}
              />
            </div>
          </section>
        )}

        {/* 매매 */}
        {leaseTypes.includes('매매') && (
          <section ref={purchaseRef} className={styles.section}>
            <h2 className={styles.sectionTitle}>매매</h2>

            <div className={styles.priceHeader}>
              <h3 className={styles.subTitle}>매매가</h3>
              <span className={styles.priceValue}>
                {purchasePriceRange[0] === 0 && purchasePriceRange[1] === 100000
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
          {getTotalCount()}개 매물 보기
        </button>
      </footer>
    </div>
  );
}
