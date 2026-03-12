'use client';

import styles from './ChatRoomItem.module.css';

interface ChatRoomItemProps {
  opponentNickname: string;
  opponentProfileUrl: string | null;
  propertyTitle: string;
  propertyThumbnailUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  onClick: () => void;
}

export default function ChatRoomItem({
  opponentNickname,
  opponentProfileUrl,
  propertyTitle,
  propertyThumbnailUrl,
  lastMessage,
  lastMessageAt,
  unreadCount,
  onClick,
}: ChatRoomItemProps) {
  return (
    <button className={styles.item} onClick={onClick}>
      <div className={styles.avatar}>
        {opponentProfileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={opponentProfileUrl} alt={opponentNickname} className={styles.avatarImage} />
        ) : (
          <span className="material-symbols-outlined">person</span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.nickname}>{opponentNickname}</span>
          <span className={styles.time}>{lastMessageAt}</span>
        </div>
        <div className={styles.middleRow}>
          <span className={styles.lastMessage}>{lastMessage}</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className={styles.propertyRow}>
          {propertyThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={propertyThumbnailUrl} alt="" className={styles.propertyThumb} />
          ) : (
            <div className={styles.propertyThumbEmpty}>
              <span className="material-symbols-outlined">home</span>
            </div>
          )}
          <span className={styles.propertyTitle}>{propertyTitle}</span>
        </div>
      </div>
    </button>
  );
}
