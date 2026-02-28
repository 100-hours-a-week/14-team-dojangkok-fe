'use client';

import Image from 'next/image';
import StampBadge from '../StampBadge';
import styles from './PropertyCard.module.css';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onClick: (id: string) => void;
  onFavoriteClick?: (id: string, event: React.MouseEvent) => void;
  onOptionClick?: (
    property: Property,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
  showDetails?: boolean;
  footer?: React.ReactNode;
}

export default function PropertyCard({
  property,
  onClick,
  onFavoriteClick,
  onOptionClick,
  showDetails = true,
  footer,
}: PropertyCardProps) {
  const formatPrice = () => {
    if (property.priceType === '월세') {
      return `월세 ${property.deposit}/${property.monthlyRent}`;
    } else if (property.priceType === '전세') {
      return `전세 ${property.deposit.toLocaleString()}`;
    } else {
      return `매매 ${property.deposit.toLocaleString()}`;
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일전`;
  };

  const hasImage = property.images && property.images.length > 0 && property.images[0];

  return (
    <article
      className={styles.card}
      onClick={() => onClick(property.id)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.imageContainer}>
        {hasImage ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className={styles.image}
            sizes="110px"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className="material-symbols-outlined">home</span>
          </div>
        )}
        {property.isReviewed && (
          <div className={styles.stampContainer}>
            <StampBadge size="medium" />
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <div className={styles.header}>
            <h3 className={styles.price}>{formatPrice()}</h3>
            <div className={styles.headerActions}>
              {onFavoriteClick && (
                <button
                  className={styles.favoriteButton}
                  onClick={(e) => onFavoriteClick(property.id, e)}
                  aria-label={property.isFavorite ? '찜 해제' : '찜하기'}
                >
                  <span
                    className={`material-symbols-outlined ${
                      styles.favoriteIcon
                    } ${property.isFavorite ? styles.favoriteActive : ''}`}
                  >
                    {property.isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              )}
              {onOptionClick && (
                <button
                  className={styles.optionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOptionClick(property, e);
                  }}
                  aria-label="옵션 더보기"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              )}
            </div>
          </div>

          <h4 className={styles.title}>{property.title}</h4>

          {showDetails && <p className={styles.address}>{property.detailedAddress}</p>}
        </div>

        {showDetails ? (
          <div className={styles.details}>
            <div className={styles.detailsLeft}>
              <span>{property.propertyType}</span>
              <span className={styles.dot}></span>
              <span>{property.floor}층</span>
              <span className={styles.dot}></span>
              <span>{property.area}m²</span>
              <span className={styles.dot}></span>
              <span>{property.maintenanceFee ? `관리비 ${property.maintenanceFee}만` : '관리비 없음'}</span>
            </div>
            <span className={styles.time}>{getTimeAgo(property.createdAt)}</span>
          </div>
        ) : (
          footer && <div className={styles.footer}>{footer}</div>
        )}
      </div>
    </article>
  );
}
