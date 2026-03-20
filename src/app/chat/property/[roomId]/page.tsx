'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/common/Header';
import ActionSheet, {
  ActionSheetOption,
} from '@/components/common/ActionSheet';
import Modal from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import PropertyChatCard from '@/components/chat/PropertyChatCard';
import MessageBubble from '@/components/chat/MessageBubble';
import DateDivider from '@/components/chat/DateDivider';
import MessageInput from '@/components/chat/MessageInput';
import { useStompChat } from '@/hooks/useStompChat';
import type { TextContent, ImageContent, VideoContent } from '@/types/chat';
import styles from './page.module.css';

function getMessageText(
  contentType: string,
  content: TextContent | ImageContent | VideoContent
): string {
  if (contentType === 'TEXT') return (content as TextContent).text;
  if (contentType === 'IMAGE') return '[이미지]';
  if (contentType === 'VIDEO') return '[동영상]';
  return '';
}

function formatPrice(room: {
  priceMain?: number;
  priceMonthly?: number | null;
  rentType?: string;
}): string {
  if (!room.priceMain && !room.rentType) return '';
  const main = room.priceMain ? `${(room.priceMain / 10000).toFixed(0)}만` : '';
  switch (room.rentType) {
    case 'MONTHLY':
      return `월세 ${main}/${room.priceMonthly ?? 0}만`;
    case 'JEONSE':
      return `전세 ${main}`;
    case 'JEONSE_MONTHLY':
      return `반전세 ${main}/${room.priceMonthly ?? 0}만`;
    case 'SALE':
      return `매매 ${main}`;
    default:
      return main;
  }
}

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { success } = useToast();
  const { user } = useAuth();

  const myUserId = user?.id ?? '';

  const {
    messages,
    roomDetail,
    isLoading,
    hasMore,
    sendText,
    retryMessage,
    cancelMessage,
    messagesEndRef,
    topSentinelRef,
  } = useStompChat(roomId, myUserId);

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [actionSheetPosition, setActionSheetPosition] = useState({
    top: 0,
    right: 0,
  });

  const opponentNickname = roomDetail?.partnerInfo.nickname ?? '';
  const property = roomDetail?.property ?? null;
  const propertyInfo = property
    ? {
        propertyId: Number(property.propertyId),
        title: property.title,
        price: formatPrice(property),
        thumbnailUrl: property.imageUrl,
        isDeleted: property.dealStatus === 'DELETED',
      }
    : {
        propertyId: 0,
        title: '삭제된 매물입니다',
        price: '',
        thumbnailUrl: null,
        isDeleted: true,
      };

  const handleLeave = () => {
    setIsLeaveModalOpen(false);
    success('채팅방을 나갔습니다.');
    router.replace('/chat/property/rooms');
  };

  const actionSheetOptions: ActionSheetOption[] = [
    {
      label: '채팅방 나가기',
      destructive: true,
      icon: 'exit_to_app',
      onClick: () => setIsLeaveModalOpen(true),
    },
  ];

  return (
    <div className={styles.page}>
      <Header
        title={isLoading ? '로딩 중...' : opponentNickname}
        showBackButton
        onBackClick={() => router.back()}
        rightIcon="more_vert"
        onRightClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setActionSheetPosition({
            top: rect.bottom + window.scrollY + 8,
            right: window.innerWidth - rect.right,
          });
          setIsActionSheetOpen(true);
        }}
      />

      {!isLoading && <PropertyChatCard {...propertyInfo} />}

      <main className={styles.main}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'var(--gray-400)',
            }}
          >
            <p>메시지를 불러오는 중...</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {/* 위로 스크롤 감지 센티넬 */}
            <div ref={topSentinelRef} style={{ height: 1 }} />
            {hasMore && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  color: 'var(--gray-400)',
                  fontSize: 12,
                }}
              >
                이전 메시지 로딩 중...
              </div>
            )}

            {messages.map((msg, idx) => {
              const isMine = msg.mine;
              const prevMsg = messages[idx - 1];
              const nextMsg = messages[idx + 1];

              const showDate =
                idx === 0 ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();

              const time = new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              // 다음 메시지가 같은 발신자 + 같은 분이면 시간 숨김
              const nextTime = nextMsg
                ? new Date(nextMsg.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              const showTime =
                !nextMsg || nextMsg.mine !== msg.mine || nextTime !== time;

              // 상대방 메시지: 이전 메시지가 다른 발신자이면 아바타/닉네임 표시
              const showAvatar =
                !isMine && (!prevMsg || prevMsg.mine || showDate);

              const text = getMessageText(msg.contentType, msg.content);

              return (
                <div key={msg.messageId || msg.localId}>
                  {showDate && (
                    <DateDivider
                      date={new Date(msg.createdAt).toLocaleDateString(
                        'ko-KR',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    />
                  )}
                  <MessageBubble
                    content={text}
                    isMine={isMine}
                    time={time}
                    showTime={showTime}
                    showAvatar={showAvatar}
                    senderNickname={opponentNickname}
                    senderProfileImageUrl={
                      roomDetail?.partnerInfo.profileImageUrl ?? null
                    }
                    isRead={msg.isRead}
                    isFailed={msg.isFailed}
                    onRetry={() => retryMessage(msg.localId!)}
                    onCancel={() => cancelMessage(msg.localId!)}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className={styles.inputArea}>
        <MessageInput
          onSend={sendText}
          showAttachment
          onAttach={(file) => console.log('attach', file)}
        />
      </div>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        options={actionSheetOptions}
        position={actionSheetPosition}
      />

      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeave}
        title="채팅방을 나갈까요?"
        confirmText="나가기"
        cancelText="취소"
        variant="destructive"
      >
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          나가면 대화 내용이 모두 삭제됩니다.
        </p>
      </Modal>
    </div>
  );
}
