import styles from './StampBadge.module.css';

interface StampBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export default function StampBadge({ size = 'medium' }: StampBadgeProps) {
  return (
    <div className={`${styles.stamp} ${styles[size]}`}>
      <span className="material-symbols-outlined">verified</span>
    </div>
  );
}
