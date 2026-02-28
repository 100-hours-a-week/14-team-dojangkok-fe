'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { StampBadge, Modal } from '@/components/common';

const ImageViewerModal = dynamic(
  () => import('@/components/common/ImageViewerModal'),
  { ssr: false }
);
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  getPropertyPost,
  deletePropertyPost,
} from '@/lib/api/property';
import { usePropertyBookmark } from '@/hooks/usePropertyBookmark';
import type { PropertyPostDetailDto } from '@/types/property';
import { PROPERTY_TYPE_LABELS, RENT_TYPE_LABELS } from '@/types/property';
import styles from './detail.module.css';

function getCorrectProfileImageUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  // 잘못된 S3 URL인지 확인 (S3 주소 안에 http가 또 들어있는 경우)
  if (url.includes('s3.ap-northeast-2.amazonaws.com/http')) {
    try {
      // ? 앞부분(경로)과 뒷부분(쿼리 파라미터) 분리
      const urlParts = url.split('?');
      const pathPart = urlParts[0];
      // 경로에서 http로 시작하는 인코딩된 URL 부분 추출
      const encodedUrlPart = pathPart.substring(pathPart.indexOf('http'));
      // 디코딩하여 원래의 카카오 URL로 복원
      return decodeURIComponent(encodedUrlPart);
    } catch (e) {
      console.error('Failed to decode profile image URL:', url, e);
      return null; // 복원 실패 시 null 반환
    }
  }
  // 정상적인 URL은 그대로 반환
  return url;
}

function formatPrice(dto: PropertyPostDetailDto): string {
  const main = dto.price_main.toLocaleString();
  switch (dto.rent_type) {
    case 'MONTHLY':
      return `월세 ${main}/${dto.price_monthly?.toLocaleString() ?? 0}`;
    case 'JEONSE':
      return `전세 ${main}`;
    case 'JEONSE_MONTHLY':
      return `반전세 ${main}/${dto.price_monthly?.toLocaleString() ?? 0}`;
    case 'SALE':
      return `매매 ${main}`;
  }
}

function to평(m2: number): string {
  return (m2 / 3.3058).toFixed(1);
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { error: showError, success } = useToast();

  const [property, setProperty] = useState<PropertyPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { toggleBookmark } = usePropertyBookmark({
    onOptimisticUpdate: (_, nextState) => setIsFavorite(nextState),
    onRollback: (_, prevState) => setIsFavorite(prevState),
  });

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const propertyId = Number(params.id);
  const isOwner = user?.id === String(property?.writer.member_id);
  const sortedImages = property
    ? [...property.images].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  useEffect(() => {
// ... (fetch implementation 생략 가능하도록 정확한 위치 지정)
    const fetch = async () => {
      setLoading(true);
      try {
        const response = await getPropertyPost(propertyId);
        setProperty(response.data);
        setIsFavorite(response.data.is_bookmarked);
      } catch (err: unknown) {
        const apiErr = err as { status?: number; statusCode?: number };
        const status = apiErr?.status ?? apiErr?.statusCode;
        if (status === 410) {
          showError('삭제된 게시글입니다.');
          router.replace('/property');
        } else if (status === 404) {
          showError('존재하지 않는 매물입니다.');
          router.replace('/property');
        } else {
          showError('매물 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleBackClick = () => router.back();

  const handleFavoriteClick = async () => {
    await toggleBookmark(propertyId, isFavorite);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePropertyPost(propertyId);
      success('매물이 삭제되었습니다.');
      router.replace('/property');
    } catch {
      showError('매물 삭제에 실패했습니다.');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleEditClick = () => {
    router.push(`/property/create?edit=${propertyId}`);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) handleNextImage();
    if (touchStart - touchEnd < -75) handlePrevImage();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.topNavigation}>
          <button
            className={styles.navIconButton}
            onClick={handleBackClick}
            aria-label="뒤로가기"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className={styles.loadingState}>
          <p>매물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className={styles.page}>
      {/* 상단 네비게이션 버튼 */}
      <div className={styles.topNavigation}>
        <button
          className={styles.navIconButton}
          onClick={handleBackClick}
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        {isOwner && (
          <div className={styles.headerActions}>
            <button
              className={styles.navIconButton}
              onClick={handleEditClick}
              aria-label="수정하기"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              className={`${styles.navIconButton} ${styles.dangerIcon}`}
              onClick={handleDeleteClick}
              aria-label="삭제하기"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* 이미지 갤러리 */}
      <section className={styles.imageGallery}>
        <div
          className={styles.imageContainer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {sortedImages.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.navButtonPrev}`}
                onClick={handlePrevImage}
                aria-label="이전 이미지"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className={`${styles.navButton} ${styles.navButtonNext}`}
                onClick={handleNextImage}
                aria-label="다음 이미지"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}

          {sortedImages.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sortedImages[currentImageIndex].presigned_url}
              alt={property.title}
              className={styles.image}
              onClick={() => setIsViewerOpen(true)}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span className="material-symbols-outlined">home</span>
            </div>
          )}

          <div className={styles.imageCounter}>
            {sortedImages.length > 0
              ? `${currentImageIndex + 1} / ${sortedImages.length}`
              : '이미지 없음'}
          </div>
        </div>

        {sortedImages.length > 1 && (
          <div className={styles.imageIndicators}>
            {sortedImages.map((_, index) => (
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
          {property.is_verified && (
            <div className={styles.reviewedBadge}>
              <StampBadge size="small" />
              <span>AI가 계약서 검토를 마친 매물이에요</span>
            </div>
          )}
          <h1 className={styles.price}>{formatPrice(property)}</h1>
          <h2 className={styles.title}>{property.title}</h2>
          <p className={styles.address}>{property.address}{property.address_detail ? ` ${property.address_detail}` : ''}</p>
        </section>

        {/* 매물 정보 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>매물 정보</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>매물 유형</span>
              <span className={styles.infoValue}>
                {PROPERTY_TYPE_LABELS[property.property_type]}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>거래 유형</span>
              <span className={styles.infoValue}>
                {RENT_TYPE_LABELS[property.rent_type]}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>면적</span>
              <span className={styles.infoValue}>
                {property.exclusive_area_m2}m²({to평(property.exclusive_area_m2)}평)
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>층수</span>
              <span className={styles.infoValue}>
                {property.is_basement ? `B${Math.abs(property.floor)}` : `${property.floor}`}층
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>관리비</span>
              <span className={styles.infoValue}>
                {property.maintenance_fee > 0
                  ? `${property.maintenance_fee}만원`
                  : '없음'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>거래 상태</span>
              <span className={styles.infoValue}>
                {property.deal_status === 'TRADING' ? '거래중' : '거래완료'}
              </span>
            </div>
          </div>
        </section>

        {/* 상세 설명 */}
        {property.content && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>상세 설명</h3>
            <p className={styles.description}>{property.content}</p>
          </section>
        )}

        {/* 작성자 정보 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>작성자</h3>
          <div className={styles.authorProfile}>
            <div className={styles.authorImageContainer}>
              {(() => {
                const correctedUrl = getCorrectProfileImageUrl(
                  property.writer.profile_image_url
                );
                if (correctedUrl) {
                  return (
                    <Image
                      src={correctedUrl}
                      alt="작성자 프로필 이미지"
                      fill
                      sizes="56px"
                      className={styles.authorImage}
                    />
                  );
                }
                return (
                  <div className={styles.authorImagePlaceholder}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 32, color: 'var(--gray-400)' }}
                    >
                      person
                    </span>
                  </div>
                );
              })()}
            </div>
            <p className={styles.authorName}>{property.writer.nickname}</p>
          </div>
        </section>
      </main>

      {/* 하단 고정 버튼 */}
      <footer className={styles.footer}>
        {isOwner ? (
          <button className={styles.contactButton} disabled>
            내 매물입니다
          </button>
        ) : (
          <>
            <button
              className={styles.favoriteButton}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? '스크랩 해제' : '스크랩'}
            >
              <span
                className={`material-symbols-outlined ${
                  isFavorite ? styles.favoriteActive : ''
                }`}
              >
                {isFavorite ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            <button className={styles.contactButton}>문의하기</button>
          </>
        )}
      </footer>

      <ImageViewerModal
        isOpen={isViewerOpen}
        images={sortedImages.map((img) => ({
          id: String(img.file_asset_id),
          url: img.presigned_url,
        }))}
        currentIndex={currentImageIndex}
        onClose={() => setIsViewerOpen(false)}
        onPrevious={() => setCurrentImageIndex((prev) => Math.max(prev - 1, 0))}
        onNext={() => setCurrentImageIndex((prev) => Math.min(prev + 1, sortedImages.length - 1))}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="매물을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
      >
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          삭제된 매물은 복구할 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}
