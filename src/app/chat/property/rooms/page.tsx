'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import styles from './page.module.css';

const DUMMY_ROOMS = [
  {
    roomId: 'room-1',
    opponentNickname: '김철수',
    opponentProfileUrl: null,
    propertyTitle: '강남구 역삼동 원룸 보증금 1000/60',
    propertyThumbnailUrl: null,
    lastMessage: '안녕하세요! 방 아직 있나요?',
    lastMessageAt: '오후 2:30',
    unreadCount: 3,
  },
  {
    roomId: 'room-2',
    opponentNickname: '이영희',
    opponentProfileUrl: null,
    propertyTitle: '마포구 합정동 투룸 전세 1억 5000',
    propertyThumbnailUrl: null,
    lastMessage: '네, 내일 오전에 방문 가능합니다',
    lastMessageAt: '오전 11:15',
    unreadCount: 0,
  },
  {
    roomId: 'room-3',
    opponentNickname: '박지민',
    opponentProfileUrl: null,
    propertyTitle: '서대문구 연희동 반지하 월세 500/40',
    propertyThumbnailUrl: null,
    lastMessage: '계약서 보내드릴게요',
    lastMessageAt: '어제',
    unreadCount: 1,
  },
  {
    roomId: 'room-4',
    opponentNickname: '최민준',
    opponentProfileUrl: null,
    propertyTitle: '송파구 잠실동 오피스텔 월세 2000/80',
    propertyThumbnailUrl: null,
    lastMessage: '관리비는 별도인가요?',
    lastMessageAt: '월요일',
    unreadCount: 0,
  },
  {
    roomId: 'room-5',
    opponentNickname: '한수진',
    opponentProfileUrl: null,
    propertyTitle: '용산구 이태원동 원룸 보증금 500/55',
    propertyThumbnailUrl: null,
    lastMessage: '감사합니다. 연락드릴게요!',
    lastMessageAt: '3월 8일',
    unreadCount: 0,
  },
];

export default function ChatRoomsPage() {
  const router = useRouter();

  // TODO: useChatRooms 훅으로 교체
  const rooms = DUMMY_ROOMS;

  return (
    <div className={styles.page}>
      <Header
        title="채팅"
        showBackButton
        onBackClick={() => router.back()}
      />
      <main className={styles.main}>
        {rooms.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">chat_bubble_outline</span>
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
                  {...room}
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
