'use client';

import Image from 'next/image';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  content: string;
  children?: React.ReactNode;
  imageUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  onImageClick?: () => void;
  isMine: boolean;
  time: string;
  showTime?: boolean;
  showAvatar?: boolean;
  senderNickname?: string;
  senderProfileImageUrl?: string | null;
  avatarIcon?: string;
  isRead?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function MessageBubble({
  content,
  children,
  imageUrl,
  mediaType,
  onImageClick,
  isMine,
  time,
  showTime = true,
  showAvatar = false,
  senderNickname,
  senderProfileImageUrl,
  avatarIcon,
  isRead,
  isFailed,
  onRetry,
  onCancel,
}: MessageBubbleProps) {
  return (
    <div
      className={`${styles.wrapper} ${isMine ? styles.wrapperMine : styles.wrapperOpponent}`}
    >
      {/* 상대방 아바타 */}
      {!isMine && (
        <div className={styles.avatarSlot}>
          {showAvatar &&
            (senderProfileImageUrl ? (
              <Image
                src={senderProfileImageUrl}
                alt={senderNickname ?? '상대방'}
                width={32}
                height={32}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                <span className="material-symbols-outlined">
                  {avatarIcon ?? 'person'}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className={styles.column}>
        {/* 닉네임 (첫 메시지에만) */}
        {!isMine && showAvatar && senderNickname && (
          <span className={styles.nickname}>{senderNickname}</span>
        )}

        <div
          className={`${styles.row} ${isMine ? styles.mine : styles.opponent}`}
        >
          <div
            className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOpponent} ${isFailed ? styles.bubbleFailed : ''} ${imageUrl ? styles.bubbleImage : ''} ${children !== undefined && !imageUrl ? styles.bubbleMarkdown : ''}`}
          >
            {imageUrl && mediaType === 'VIDEO' ? (
              <div
                className={styles.videoWrapper}
                onClick={onImageClick}
                style={onImageClick ? { cursor: 'pointer' } : undefined}
              >
                <video
                  src={imageUrl}
                  className={styles.image}
                  preload="metadata"
                />
                <div className={styles.playIcon}>
                  <span className="material-symbols-outlined">play_circle</span>
                </div>
              </div>
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="이미지"
                className={styles.image}
                onClick={onImageClick}
                style={onImageClick ? { cursor: 'pointer' } : undefined}
              />
            ) : children !== undefined ? (
              children
            ) : (
              content
            )}
          </div>
          {showTime && (
            <div className={styles.meta}>
              {isMine && isRead && (
                <span className={styles.readStatus}>읽음</span>
              )}
              <span className={styles.time}>{time}</span>
            </div>
          )}
          {isFailed && (
            <div className={styles.failedActions}>
              <button
                className={styles.retryButton}
                onClick={onRetry}
                aria-label="재전송"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                className={styles.cancelButton}
                onClick={onCancel}
                aria-label="취소"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
