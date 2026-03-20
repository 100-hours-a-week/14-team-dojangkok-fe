'use client';

import Image from 'next/image';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  time: string;
  showTime?: boolean;
  showAvatar?: boolean;
  senderNickname?: string;
  senderProfileImageUrl?: string | null;
  isRead?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function MessageBubble({
  content,
  isMine,
  time,
  showTime = true,
  showAvatar = false,
  senderNickname,
  senderProfileImageUrl,
  isRead,
  isFailed,
  onRetry,
  onCancel,
}: MessageBubbleProps) {
  return (
    <div className={`${styles.wrapper} ${isMine ? styles.wrapperMine : styles.wrapperOpponent}`}>
      {/* 상대방 아바타 */}
      {!isMine && (
        <div className={styles.avatarSlot}>
          {showAvatar && (
            senderProfileImageUrl ? (
              <Image
                src={senderProfileImageUrl}
                alt={senderNickname ?? '상대방'}
                width={32}
                height={32}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                <span className="material-symbols-outlined">person</span>
              </div>
            )
          )}
        </div>
      )}

      <div className={styles.column}>
        {/* 닉네임 (첫 메시지에만) */}
        {!isMine && showAvatar && senderNickname && (
          <span className={styles.nickname}>{senderNickname}</span>
        )}

        <div className={`${styles.row} ${isMine ? styles.mine : styles.opponent}`}>
          <div
            className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOpponent} ${isFailed ? styles.bubbleFailed : ''}`}
          >
            {content}
          </div>
          {showTime && (
            <div className={styles.meta}>
              {isMine && isRead && <span className={styles.readStatus}>읽음</span>}
              <span className={styles.time}>{time}</span>
            </div>
          )}
          {isFailed && (
            <div className={styles.failedActions}>
              <button className={styles.retryButton} onClick={onRetry} aria-label="재전송">
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button className={styles.cancelButton} onClick={onCancel} aria-label="취소">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
