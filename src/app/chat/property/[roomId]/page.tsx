'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/common/Header';
import ActionSheet, { ActionSheetOption } from '@/components/common/ActionSheet';
import Modal from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import PropertyChatCard from '@/components/chat/PropertyChatCard';
import MessageBubble from '@/components/chat/MessageBubble';
import DateDivider from '@/components/chat/DateDivider';
import MessageInput from '@/components/chat/MessageInput';
import styles from './page.module.css';

const MY_ID = 'me';

const AUTO_REPLIES = [
  '네, 확인했습니다!',
  '좀 더 자세히 알려주실 수 있나요?',
  '언제 방문 가능하신가요?',
  '감사합니다 :)',
  '잠시만요, 확인해볼게요.',
];

interface Message {
  messageId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isFailed?: boolean;
  localId?: string;
}

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { success } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      messageId: 'init-1',
      senderId: 'opponent',
      content: '안녕하세요! 방 관련해서 문의드려도 될까요?',
      createdAt: new Date('2026-03-10T10:05:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-2',
      senderId: MY_ID,
      content: '네, 말씀하세요!',
      createdAt: new Date('2026-03-10T10:07:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-3',
      senderId: 'opponent',
      content: '방 아직 나와 있나요? 전세로 알고 있는데 맞나요?',
      createdAt: new Date('2026-03-10T10:08:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-4',
      senderId: MY_ID,
      content: '네 맞아요. 보증금 1억 5천에 전세로 내놓은 매물입니다.',
      createdAt: new Date('2026-03-10T10:10:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-5',
      senderId: 'opponent',
      content: '혹시 관리비는 어떻게 되나요?',
      createdAt: new Date('2026-03-10T10:11:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-6',
      senderId: MY_ID,
      content: '관리비는 월 5만원이고 인터넷, 청소비 포함입니다.',
      createdAt: new Date('2026-03-10T10:13:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-7',
      senderId: 'opponent',
      content: '오 좋네요. 주차는 가능한가요?',
      createdAt: new Date('2026-03-11T14:22:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-8',
      senderId: MY_ID,
      content: '지하 주차장 1대 가능합니다 😊',
      createdAt: new Date('2026-03-11T14:25:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-9',
      senderId: 'opponent',
      content: '직접 방문해서 볼 수 있을까요? 이번 주말 가능하신가요?',
      createdAt: new Date('2026-03-11T14:26:00').toISOString(),
      isRead: true,
    },
    {
      messageId: 'init-10',
      senderId: MY_ID,
      content: '토요일 오전은 괜찮아요. 몇 시가 편하세요?',
      createdAt: new Date('2026-03-11T14:30:00').toISOString(),
      isRead: false,
    },
  ]);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [actionSheetPosition, setActionSheetPosition] = useState({ top: 0, right: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const opponentNickname = '김철수';
  // room-3은 삭제된 매물로 테스트
  const propertyInfo = {
    propertyId: 1,
    title: '강남구 역삼동 원룸 보증금 1000/60',
    price: '월세 1000/60만',
    thumbnailUrl: null,
    isDeleted: roomId === 'room-3',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    const localId = `local-${Date.now()}`;
    const isForceFail = text.trim() === '!fail';

    const newMsg: Message = {
      messageId: '',
      localId,
      senderId: MY_ID,
      content: isForceFail ? '전송 테스트 메시지' : text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);

    if (isForceFail) {
      // 전송 실패 시뮬레이션
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.localId === localId ? { ...m, isFailed: true } : m))
        );
      }, 800);
      return;
    }

    // 상대방 자동 답장 시뮬레이션
    setTimeout(() => {
      const reply: Message = {
        messageId: `reply-${Date.now()}`,
        senderId: 'opponent',
        content: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500 + Math.random() * 1500);
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
        title={opponentNickname}
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

      <PropertyChatCard {...propertyInfo} />

      <main className={styles.main}>
        <div className={styles.messages}>
          {messages.map((msg, idx) => {
            const isMine = msg.senderId === MY_ID;
            const prevMsg = messages[idx - 1];
            const showDate =
              idx === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(prevMsg.createdAt).toDateString();

            const time = new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.messageId || msg.localId}>
                {showDate && (
                  <DateDivider
                    date={new Date(msg.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  />
                )}
                <MessageBubble
                  content={msg.content}
                  isMine={isMine}
                  time={time}
                  isRead={msg.isRead}
                  isFailed={msg.isFailed}
                  onRetry={() => handleSend(msg.content)}
                  onCancel={() =>
                    setMessages((prev) =>
                      prev.filter((m) => m.localId !== msg.localId)
                    )
                  }
                />
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </main>

      <div className={styles.inputArea}>
        <MessageInput
          onSend={handleSend}
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
