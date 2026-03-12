'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/common/Header';
import MessageInput from '@/components/chat/MessageInput';
import DateDivider from '@/components/chat/DateDivider';
import styles from './page.module.css';

interface AiMessage {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

const DUMMY_RESPONSES = [
  `계약서를 검토한 결과, 몇 가지 주의사항이 있습니다.\n\n**1. 특약사항 확인**\n특약사항에 "원상복구" 관련 조항이 포함되어 있으니 퇴실 시 주의가 필요합니다.\n\n**2. 관리비 항목**\n관리비에 포함된 항목을 꼼꼼히 확인하세요. 일부 항목이 별도 청구될 수 있습니다.`,
  `네, 해당 조항은 임차인에게 불리한 조항입니다. 계약 전에 집주인과 협의하여 수정을 요청하는 것이 좋습니다.`,
  `전세보증금 반환 관련해서는 **전세보증보험** 가입을 강력히 추천드립니다. HUG(주택도시보증공사)나 SGI서울보증에서 가입 가능합니다.`,
  `계약 만료 **2개월 전**에 갱신 의사를 집주인에게 통보해야 합니다. 이를 놓치면 묵시적 갱신이 될 수 있습니다.`,
];

export default function AiChatPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.contractId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      messageId: 'ai-init-1',
      role: 'USER',
      content: '이 계약서에서 특별히 주의해야 할 점이 있나요?',
      createdAt: new Date('2026-03-12T09:10:00').toISOString(),
    },
    {
      messageId: 'ai-init-2',
      role: 'ASSISTANT',
      content: `계약서를 검토한 결과, 다음 사항들을 주의하세요.\n\n**1. 특약사항 확인**\n특약사항에 "원상복구" 관련 조항이 포함되어 있으니 퇴실 시 주의가 필요합니다.\n\n**2. 관리비 항목**\n관리비에 포함된 항목을 꼼꼼히 확인하세요. 일부 항목이 별도 청구될 수 있습니다.\n\n**3. 계약 갱신 조항**\n계약 만료 2개월 전 갱신 의사를 통보해야 합니다.`,
      createdAt: new Date('2026-03-12T09:10:15').toISOString(),
    },
    {
      messageId: 'ai-init-3',
      role: 'USER',
      content: '전세보증금 보호는 어떻게 해야 하나요?',
      createdAt: new Date('2026-03-12T09:12:00').toISOString(),
    },
    {
      messageId: 'ai-init-4',
      role: 'ASSISTANT',
      content: `전세보증금 보호를 위해 아래 방법을 권장합니다.\n\n**전세보증보험 가입**\n- HUG(주택도시보증공사)\n- SGI서울보증\n\n입주 후 **전입신고 + 확정일자**를 반드시 받으세요. 이 두 가지를 완료해야 대항력이 생깁니다.`,
      createdAt: new Date('2026-03-12T09:12:20').toISOString(),
    },
  ]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
    };
  }, []);

  const handleSend = (question: string) => {
    if (isStreaming) return;

    const userMsg: AiMessage = {
      messageId: `user-${Date.now()}`,
      role: 'USER',
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 스트리밍 시뮬레이션
    const fullResponse =
      DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
    let index = 0;
    setIsStreaming(true);
    setStreamingContent('');

    // 500ms 후 스트리밍 시작
    setTimeout(() => {
      streamingTimerRef.current = setInterval(() => {
        index += 2;
        setStreamingContent(fullResponse.slice(0, index));

        if (index >= fullResponse.length) {
          clearInterval(streamingTimerRef.current!);
          setIsStreaming(false);
          setStreamingContent('');
          setMessages((prev) => [
            ...prev,
            {
              messageId: `ai-${Date.now()}`,
              role: 'ASSISTANT',
              content: fullResponse,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }, 30);
    }, 500);

    console.log('ai question', question, contractId);
  };

  return (
    <div className={styles.page}>
      <Header
        title="AI 챗봇"
        showBackButton
        onBackClick={() => router.back()}
      />

      <main className={styles.main}>
        {messages.length === 0 && !streamingContent ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">smart_toy</span>
            <p>계약서에 대해 궁금한 점을 물어보세요</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg, idx) => {
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
                <div key={msg.messageId}>
                  {showDate && (
                    <DateDivider
                      date={new Date(msg.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  )}
                  {msg.role === 'USER' ? (
                    <div className={styles.userMessage}>
                      <div className={styles.userBubble}>{msg.content}</div>
                      <span className={styles.time}>{time}</span>
                    </div>
                  ) : (
                    <div className={styles.aiBubbleWrapper}>
                      <div className={styles.aiAvatar}>
                        <span className="material-symbols-outlined">smart_toy</span>
                      </div>
                      <div className={styles.aiContent}>
                        <div className={styles.aiBubble}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        <span className={styles.time}>{time}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 스트리밍 중인 AI 응답 */}
            {(isStreaming || streamingContent) && (
              <div className={styles.aiBubbleWrapper}>
                <div className={styles.aiAvatar}>
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div className={styles.aiContent}>
                  <div className={styles.aiBubble}>
                    {streamingContent}
                    {isStreaming && <span className={styles.cursor} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className={styles.inputArea}>
        <MessageInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder="계약서에 대해 질문해보세요"
        />
      </div>
    </div>
  );
}
