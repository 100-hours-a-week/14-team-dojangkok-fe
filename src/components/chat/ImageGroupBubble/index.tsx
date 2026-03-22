'use client';

import Image from 'next/image';
import styles from './ImageGroupBubble.module.css';

interface ImageItem {
  localId?: string;
  messageId: string;
  url: string;
  contentType?: 'IMAGE' | 'VIDEO';
  isFailed?: boolean;
}

interface ImageGroupBubbleProps {
  images: ImageItem[];
  isMine: boolean;
  time: string;
  showTime?: boolean;
  showAvatar?: boolean;
  senderNickname?: string;
  senderProfileImageUrl?: string | null;
  isRead?: boolean;
  onImageClick?: (index: number) => void;
  onRetry?: (localId: string) => void;
  onCancel?: (localId: string) => void;
}

export default function ImageGroupBubble({
  images,
  isMine,
  time,
  showTime = true,
  showAvatar = false,
  senderNickname,
  senderProfileImageUrl,
  isRead,
  onImageClick,
  onRetry,
  onCancel,
}: ImageGroupBubbleProps) {
  const cols = Math.min(images.length, 3);

  return (
    <div
      className={`${styles.wrapper} ${isMine ? styles.wrapperMine : styles.wrapperOpponent}`}
    >
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
                <span className="material-symbols-outlined">person</span>
              </div>
            ))}
        </div>
      )}

      <div className={styles.column}>
        {!isMine && showAvatar && senderNickname && (
          <span className={styles.nickname}>{senderNickname}</span>
        )}

        <div
          className={`${styles.row} ${isMine ? styles.mine : styles.opponent}`}
        >
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {images.map((img, idx) => (
              <div
                key={img.localId || img.messageId}
                className={styles.gridImage}
              >
                {img.contentType === 'VIDEO' ? (
                  <div
                    className={styles.videoWrapper}
                    onClick={() => !img.isFailed && onImageClick?.(idx)}
                    style={
                      !img.isFailed && onImageClick
                        ? { cursor: 'pointer' }
                        : undefined
                    }
                  >
                    <video
                      src={img.url}
                      className={styles.image}
                      preload="metadata"
                    />
                    <div className={styles.playIcon}>
                      <span className="material-symbols-outlined">
                        play_circle
                      </span>
                    </div>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.url}
                    alt="이미지"
                    className={styles.image}
                    onClick={() => !img.isFailed && onImageClick?.(idx)}
                    style={
                      !img.isFailed && onImageClick
                        ? { cursor: 'pointer' }
                        : undefined
                    }
                  />
                )}
                {img.isFailed && (
                  <div className={styles.failedOverlay}>
                    <button
                      className={styles.retryButton}
                      onClick={() => img.localId && onRetry?.(img.localId)}
                      aria-label="재전송"
                    >
                      <span className="material-symbols-outlined">refresh</span>
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => img.localId && onCancel?.(img.localId)}
                      aria-label="취소"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showTime && (
            <div className={styles.meta}>
              {isMine && isRead && (
                <span className={styles.readStatus}>읽음</span>
              )}
              <span className={styles.time}>{time}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
