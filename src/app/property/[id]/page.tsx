'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { StampBadge } from '@/components/common';
import styles from './detail.module.css';

// Mock data - 실제로는 API에서 가져와야 함
const MOCK_PROPERTY = {
  id: '1',
  title: '공도읍 진사리 조용한 풀옵션 원룸',
  address: '경기 안성시 공도읍',
  detailedAddress: '경기 안성시 공도읍 진사리',
  priceType: '월세' as const,
  deposit: 300,
  monthlyRent: 35,
  propertyType: '원룸' as const,
  floor: 1,
  area: 23,
  maintenanceFee: 5,
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
  ],
  isReviewed: true,
  isFavorite: false,
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  description:
    '조용하고 깔끔한 풀옵션 원룸입니다. 대중교통 접근성이 좋고, 주변 편의시설이 가까워 생활하기 편리합니다. 신축 건물로 시설이 깨끗하며, 관리가 잘 되고 있습니다.',
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(MOCK_PROPERTY.isFavorite);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleBackClick = () => {
    router.back();
  };

  const handleMenuClick = () => {
    // TODO: 메뉴 기능 구현
    console.log('Menu clicked');
  };

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
  };

  const handleContactClick = () => {
    // TODO: 문의하기 기능 구현
    console.log('Contact clicked');
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? MOCK_PROPERTY.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === MOCK_PROPERTY.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // 왼쪽으로 스와이프 (다음 이미지)
      handleNextImage();
    }

    if (touchStart - touchEnd < -75) {
      // 오른쪽으로 스와이프 (이전 이미지)
      handlePrevImage();
    }
  };

  const formatPrice = () => {
    if (MOCK_PROPERTY.priceType === '월세') {
      return `월세 ${MOCK_PROPERTY.deposit}/${MOCK_PROPERTY.monthlyRent}`;
    } else if (MOCK_PROPERTY.priceType === '전세') {
      return `전세 ${MOCK_PROPERTY.deposit.toLocaleString()}`;
    } else {
      return `매매 ${MOCK_PROPERTY.deposit.toLocaleString()}`;
    }
  };

  return (
    <div className={styles.page}>
      {/* 상단 네비게이션 버튼 (이미지 위에 플로팅) */}
      <div className={styles.topNavigation}>
        <button
          className={styles.navIconButton}
          onClick={handleBackClick}
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          className={styles.navIconButton}
          onClick={handleMenuClick}
          aria-label="메뉴"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* 이미지 갤러리 */}
      <section className={styles.imageGallery}>
        <div
          className={styles.imageContainer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {MOCK_PROPERTY.images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.navButtonPrev}`}
                onClick={handlePrevImage}
                aria-label="이전 이미지"
              >
                <span className="material-symbols-outlined">
                  chevron_left
                </span>
              </button>
              <button
                className={`${styles.navButton} ${styles.navButtonNext}`}
                onClick={handleNextImage}
                aria-label="다음 이미지"
              >
                <span className="material-symbols-outlined">
                  chevron_right
                </span>
              </button>
            </>
          )}

          <Image
            src={MOCK_PROPERTY.images[currentImageIndex]}
            alt={MOCK_PROPERTY.title}
            fill
            className={styles.image}
            priority
          />
          <div className={styles.imageCounter}>
            {currentImageIndex + 1} / {MOCK_PROPERTY.images.length}
          </div>
        </div>
        {MOCK_PROPERTY.images.length > 1 && (
          <div className={styles.imageIndicators}>
            {MOCK_PROPERTY.images.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${
                  index === currentImageIndex ? styles.indicatorActive : ''
                }`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`이미지 ${index + 1}로 이동`}
              />
            ))}
          </div>
        )}
      </section>

      <main className={styles.main}>
        {/* 가격 정보 */}
        <section className={styles.section}>
          {MOCK_PROPERTY.isReviewed && (
            <div className={styles.reviewedBadge}>
              <StampBadge size="small" />
              <span>AI가 계약서 검토를 마친 매물이에요</span>
            </div>
          )}
          <h1 className={styles.price}>{formatPrice()}</h1>
          <h2 className={styles.title}>{MOCK_PROPERTY.title}</h2>
          <p className={styles.address}>{MOCK_PROPERTY.detailedAddress}</p>
        </section>

        {/* 매물 정보 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>매물 정보</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>매물 유형</span>
              <span className={styles.infoValue}>
                {MOCK_PROPERTY.propertyType}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>면적</span>
              <span className={styles.infoValue}>{MOCK_PROPERTY.area}m²</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>층수</span>
              <span className={styles.infoValue}>{MOCK_PROPERTY.floor}층</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>관리비</span>
              <span className={styles.infoValue}>
                {MOCK_PROPERTY.maintenanceFee}만원
              </span>
            </div>
          </div>
        </section>

        {/* 상세 설명 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>상세 설명</h3>
          <p className={styles.description}>{MOCK_PROPERTY.description}</p>
        </section>
      </main>

      {/* 하단 고정 버튼 */}
      <footer className={styles.footer}>
        <button
          className={styles.favoriteButton}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? '찜 해제' : '찜하기'}
        >
          <span
            className={`material-symbols-outlined ${
              isFavorite ? styles.favoriteActive : ''
            }`}
          >
            {isFavorite ? 'favorite' : 'favorite_border'}
          </span>
        </button>
        <button className={styles.contactButton} onClick={handleContactClick}>
          문의하기
        </button>
      </footer>
    </div>
  );
}
