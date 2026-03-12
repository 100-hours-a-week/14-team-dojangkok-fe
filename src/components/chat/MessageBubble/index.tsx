'use client';

import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  time: string;
  isRead?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function MessageBubble({
  content,
  isMine,
  time,
  isRead,
  isFailed,
  onRetry,
  onCancel,
}: MessageBubbleProps) {
  return (
    <div className={`${styles.row} ${isMine ? styles.mine : styles.opponent}`}>
      <div
        className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOpponent} ${isFailed ? styles.bubbleFailed : ''}`}
      >
        {content}
      </div>
      <div className={styles.meta}>
        {isMine && isRead && (
          <span className={styles.readStatus}>읽음</span>
        )}
        <span className={styles.time}>{time}</span>
      </div>
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
  );
}
