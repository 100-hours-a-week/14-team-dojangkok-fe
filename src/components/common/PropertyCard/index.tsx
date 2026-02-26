'use client';

import Image from 'next/image';
import StampBadge from '../StampBadge';
import styles from './PropertyCard.module.css';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onClick: (id: string) => void;
  onFavoriteClick?: (id: string, event: React.MouseEvent) => void;
  showDetails?: boolean;
  footer?: React.ReactNode;
}

export default function PropertyCard({
  property,
  onClick,
  onFavoriteClick,
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일전`;
  };

  return (
    <article
      className={styles.card}
      onClick={() => onClick(property.id)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.imageContainer}>
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          className={styles.image}
          sizes="110px"
        />
        {property.isReviewed && (
          <div className={styles.stampContainer}>
            <StampBadge size="medium" />
          </div>
        )}
        <div className={styles.imageCount}>
          1/{property.images.length}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <div className={styles.header}>
            <h3 className={styles.price}>{formatPrice()}</h3>
            {onFavoriteClick && (
              <button
                className={styles.favoriteButton}
                onClick={(e) => onFavoriteClick(property.id, e)}
                aria-label={
                  property.isFavorite ? '찜 해제' : '찜하기'
                }
              >
                <span
                  className={`material-symbols-outlined ${styles.favoriteIcon}`}
                >
                  {property.isFavorite ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            )}
          </div>

          <h4 className={styles.title}>{property.title}</h4>

          <p className={styles.address}>{property.detailedAddress}</p>
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
              <span>관리비 {property.maintenanceFee}만</span>
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
