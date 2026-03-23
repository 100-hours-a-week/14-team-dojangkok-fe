'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import ImageGroupBubble from '@/components/chat/ImageGroupBubble';
import DateDivider from '@/components/chat/DateDivider';
import MessageInput from '@/components/chat/MessageInput';
import { useStompChat } from '@/hooks/useStompChat';
import type {
  ChatMessage,
  TextContent,
  ImageContent,
  VideoContent,
} from '@/types/chat';
import type { ImageItem as ViewerImageItem } from '@/types/image';
import styles from './page.module.css';

const ImageViewerModal = dynamic(
  () => import('@/components/common/ImageViewerModal'),
  { ssr: false }
);

type RenderSingle = { kind: 'single'; msg: ChatMessage; idx: number };
type RenderGroup = {
  kind: 'group';
  msgs: ChatMessage[];
  indices: number[];
};
type RenderItem = RenderSingle | RenderGroup;

function buildRenderItems(messages: ChatMessage[]): RenderItem[] {
  const items: RenderItem[] = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (
      msg.groupId &&
      (msg.contentType === 'IMAGE' || msg.contentType === 'VIDEO')
    ) {
      const groupMsgs = [msg];
      const groupIndices = [i];
      let j = i + 1;
      while (
        j < messages.length &&
        messages[j].groupId === msg.groupId &&
        (messages[j].contentType === 'IMAGE' ||
          messages[j].contentType === 'VIDEO')
      ) {
        groupMsgs.push(messages[j]);
        groupIndices.push(j);
        j++;
      }
      if (groupMsgs.length > 1) {
        items.push({ kind: 'group', msgs: groupMsgs, indices: groupIndices });
        i = j;
        continue;
      }
    }
    items.push({ kind: 'single', msg, idx: i });
    i++;
  }
  return items;
}

function getMessageText(
  contentType: string,
  content: TextContent | ImageContent | VideoContent
): string {
  if (contentType === 'TEXT') return (content as TextContent).text;
  if (contentType === 'IMAGE' || contentType === 'VIDEO') return '';
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
    isFetchingMore,
    sendText,
    sendImages,
    retryMessage,
    cancelMessage,
    messagesEndRef,
    topSentinelRef,
    scrollContainerRef,
  } = useStompChat(roomId, myUserId);

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<ViewerImageItem[]>([]);

  const openSingleViewer = (msg: ChatMessage) => {
    setViewerImages([
      {
        id: msg.localId || msg.messageId,
        url: (msg.content as ImageContent).url,
        contentType: msg.contentType as 'IMAGE' | 'VIDEO',
      },
    ]);
    setViewerIndex(0);
    setViewerOpen(true);
  };

  const openGroupViewer = (msgs: ChatMessage[], clickedIdx: number) => {
    const valid = msgs.filter((m) => !m.isFailed);
    const clickedMsg = msgs[clickedIdx];
    const idxInValid = valid.findIndex(
      (m) =>
        (m.localId || m.messageId) ===
        (clickedMsg.localId || clickedMsg.messageId)
    );
    setViewerImages(
      valid.map((m) => ({
        id: m.localId || m.messageId,
        url: (m.content as ImageContent).url,
        contentType: m.contentType as 'IMAGE' | 'VIDEO',
      }))
    );
    setViewerIndex(Math.max(0, idxInValid));
    setViewerOpen(true);
  };
  const [actionSheetPosition, setActionSheetPosition] = useState({
    top: 0,
    right: 0,
  });

  const opponentNickname = roomDetail?.partnerInfo?.nickname ?? '';

  // 내 메시지 중 마지막으로 읽힌 메시지의 index (해당 메시지에만 "읽음" 표시)
  let lastReadIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].mine && messages[i].isRead) {
      lastReadIdx = i;
      break;
    }
  }
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

      <main className={styles.main} ref={scrollContainerRef}>
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
            {isFetchingMore && (
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

            {buildRenderItems(messages).map((item, renderIdx, arr) => {
              const prevItem = arr[renderIdx - 1];
              const nextItem = arr[renderIdx + 1];
              const prevMsg = prevItem
                ? prevItem.kind === 'single'
                  ? prevItem.msg
                  : prevItem.msgs[prevItem.msgs.length - 1]
                : undefined;
              const nextMsg = nextItem
                ? nextItem.kind === 'single'
                  ? nextItem.msg
                  : nextItem.msgs[0]
                : undefined;

              const firstMsg = item.kind === 'single' ? item.msg : item.msgs[0];
              const isMine = firstMsg.mine;

              const showDate =
                !prevMsg ||
                new Date(firstMsg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();

              const time = new Date(firstMsg.createdAt).toLocaleTimeString(
                'ko-KR',
                { hour: '2-digit', minute: '2-digit' }
              );
              const nextTime = nextMsg
                ? new Date(nextMsg.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              const showTime =
                !nextMsg || nextMsg.mine !== isMine || nextTime !== time;
              const showAvatar =
                !isMine && (!prevMsg || prevMsg.mine || showDate);

              const dateStr = new Date(firstMsg.createdAt).toLocaleDateString(
                'ko-KR',
                { year: 'numeric', month: 'long', day: 'numeric' }
              );

              if (item.kind === 'group') {
                const isRead = item.indices.includes(lastReadIdx);
                return (
                  <div key={item.msgs[0].localId || item.msgs[0].messageId}>
                    {showDate && <DateDivider date={dateStr} />}
                    <ImageGroupBubble
                      images={item.msgs.map((m) => ({
                        localId: m.localId,
                        messageId: m.messageId,
                        url: (m.content as ImageContent).url,
                        contentType: m.contentType as 'IMAGE' | 'VIDEO',
                        isFailed: m.isFailed,
                      }))}
                      isMine={isMine}
                      time={time}
                      showTime={showTime}
                      showAvatar={showAvatar}
                      senderNickname={opponentNickname}
                      senderProfileImageUrl={
                        roomDetail?.partnerInfo?.profileImageUrl ?? null
                      }
                      isRead={isRead}
                      onImageClick={(imgIdx) =>
                        openGroupViewer(item.msgs, imgIdx)
                      }
                      onRetry={(localId) => retryMessage(localId)}
                      onCancel={(localId) => cancelMessage(localId)}
                    />
                  </div>
                );
              }

              const { msg, idx } = item;
              const text = getMessageText(msg.contentType, msg.content);
              const imageUrl =
                msg.contentType === 'IMAGE' || msg.contentType === 'VIDEO'
                  ? (msg.content as ImageContent).url
                  : undefined;

              return (
                <div key={msg.localId || msg.messageId}>
                  {showDate && <DateDivider date={dateStr} />}
                  <MessageBubble
                    content={text}
                    imageUrl={imageUrl}
                    mediaType={
                      msg.contentType === 'IMAGE' || msg.contentType === 'VIDEO'
                        ? msg.contentType
                        : undefined
                    }
                    onImageClick={
                      imageUrl && !msg.isFailed
                        ? () => openSingleViewer(msg)
                        : undefined
                    }
                    isMine={isMine}
                    time={time}
                    showTime={showTime}
                    showAvatar={showAvatar}
                    senderNickname={opponentNickname}
                    senderProfileImageUrl={
                      roomDetail?.partnerInfo?.profileImageUrl ?? null
                    }
                    isRead={idx === lastReadIdx}
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
        <MessageInput onSend={sendText} showAttachment onAttach={sendImages} />
      </div>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        options={actionSheetOptions}
        position={actionSheetPosition}
      />

      <ImageViewerModal
        isOpen={viewerOpen}
        images={viewerImages}
        currentIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        onPrevious={() => setViewerIndex((i) => Math.max(0, i - 1))}
        onNext={() =>
          setViewerIndex((i) => Math.min(viewerImages.length - 1, i + 1))
        }
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
