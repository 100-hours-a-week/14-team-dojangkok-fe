'use client';

import { useRouter } from 'next/navigation';
import styles from './PropertyChatCard.module.css';

interface PropertyChatCardProps {
  propertyId: number;
  title: string;
  price: string;
  thumbnailUrl: string | null;
  isDeleted?: boolean;
}

export default function PropertyChatCard({
  propertyId,
  title,
  price,
  thumbnailUrl,
  isDeleted = false,
}: PropertyChatCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isDeleted) return;
    router.push(`/property/${propertyId}`);
  };

  return (
    <button
      className={`${styles.card} ${isDeleted ? styles.deleted : ''}`}
      onClick={handleClick}
      disabled={isDeleted}
    >
      <div className={styles.thumbnail}>
        {thumbnailUrl && !isDeleted ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={title} className={styles.thumbnailImage} />
        ) : (
          <span className="material-symbols-outlined">home</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <div className={styles.priceRow}>
          <span className={styles.price}>{price}</span>
          {isDeleted && (
            <span className={styles.deletedBadge}>삭제된 매물</span>
          )}
        </div>
      </div>
      <span
        className="material-symbols-outlined"
        style={{ color: isDeleted ? 'var(--gray-200)' : 'var(--gray-400)', fontSize: 18 }}
      >
        chevron_right
      </span>
    </button>
  );
}
