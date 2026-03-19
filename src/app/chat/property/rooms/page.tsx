'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import { getChatRooms } from '@/lib/api/chat';
import type { ChatRoom } from '@/types/chat';
import styles from './page.module.css';

function getLastMessageText(room: ChatRoom): string {
  if (!room.lastMessage) return '';
  const { contentType, content } = room.lastMessage;
  if (contentType === 'IMAGE') return '[이미지]';
  if (contentType === 'VIDEO') return '[동영상]';
  return content;
}

function formatLastMessageAt(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ko-KR', { weekday: 'long' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function ChatRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      try {
        const data = await getChatRooms();
        if (!cancelled) setRooms(data.rooms);
      } catch {
        // 에러 무시 (빈 목록 표시)
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <Header title="채팅" showBackButton onBackClick={() => router.back()} />
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.empty}>
            <p>불러오는 중...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">
              chat_bubble_outline
            </span>
            <p>아직 채팅방이 없어요</p>
            <span>마음에 드는 매물을 찾아 집주인에게 먼저 연락해보세요</span>
            <button
              className={styles.exploreButton}
              onClick={() => router.push('/property')}
            >
              매물 보러가기
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {rooms.map((room) => (
              <li key={room.roomId}>
                <ChatRoomItem
                  opponentNickname={room.partnerInfo.nickname}
                  opponentProfileUrl={room.partnerInfo.profileImageUrl}
                  propertyTitle={room.property?.title ?? '삭제된 매물'}
                  propertyThumbnailUrl={room.property?.imageUrl ?? null}
                  lastMessage={getLastMessageText(room)}
                  lastMessageAt={
                    room.lastMessage
                      ? formatLastMessageAt(room.lastMessage.createdAt)
                      : ''
                  }
                  unreadCount={room.unreadCount}
                  onClick={() => router.push(`/chat/property/${room.roomId}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
