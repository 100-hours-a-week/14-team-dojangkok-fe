'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/common/Header';
import MessageInput from '@/components/chat/MessageInput';
import DateDivider from '@/components/chat/DateDivider';
import {
  streamAiChat,
  createOrGetAiChatRoom,
  getAiChatMessages,
} from '@/lib/api/chat';
import type { AiChatMessage } from '@/lib/api/chat';
import styles from './page.module.css';

interface AiMessage {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

function apiMsgToAiMessage(msg: AiChatMessage): AiMessage {
  return {
    messageId: msg.messageId,
    role: msg.senderId === 'AI_ASSISTANT' ? 'ASSISTANT' : 'USER',
    content: msg.content.text,
    createdAt: msg.createdAt,
  };
}

export default function AiChatPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.contractId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const isFetchingMoreRef = useRef(false);
  const initialScrollDone = useRef(false);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // 이전 메시지 로드
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMoreRef.current || !nextCursor || !roomIdRef.current) return;
    isFetchingMoreRef.current = true;

    const scrollContainer = topSentinelRef.current?.parentElement;
    const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;

    try {
      const data = await getAiChatMessages(roomIdRef.current, nextCursor);
      setMessages((prev) => [...data.messages.map(apiMsgToAiMessage), ...prev]);
      setHasMore(data.hasNext);
      setNextCursor(data.nextCursor);

      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // 에러 무시
    } finally {
      isFetchingMoreRef.current = false;
    }
  }, [hasMore, nextCursor]);

  // 방 생성 + 첫 메시지 로드
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const room = await createOrGetAiChatRoom(contractId);
        if (cancelled) return;
        roomIdRef.current = room.roomId;

        const data = await getAiChatMessages(room.roomId);
        if (cancelled) return;
        setMessages(data.messages.map(apiMsgToAiMessage));
        setHasMore(data.hasNext);
        setNextCursor(data.nextCursor);
      } catch {
        // 에러 무시
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [contractId]);

  // 초기 로드 완료 후 최하단 스크롤
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoading, messages.length]);

  // 새 메시지/스트리밍 시 최하단 스크롤
  useEffect(() => {
    if (initialScrollDone.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent]);

  // 위로 스크롤 감지 (IntersectionObserver)
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMoreRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleSend = async (question: string) => {
    if (isStreaming || !roomIdRef.current) return;

    const userMsg: AiMessage = {
      messageId: `user-${Date.now()}`,
      role: 'USER',
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    try {
      await streamAiChat(
        roomIdRef.current,
        question,
        (chunk) => {
          accumulated += chunk;
          setStreamingContent(accumulated);
        },
        () => {
          const finalContent = accumulated;
          setIsStreaming(false);
          setStreamingContent('');
          setMessages((prev) => [
            ...prev,
            {
              messageId: `ai-${Date.now()}`,
              role: 'ASSISTANT',
              content: finalContent,
              createdAt: new Date().toISOString(),
            },
          ]);
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setIsStreaming(false);
      setStreamingContent('');
      if (accumulated) {
        setMessages((prev) => [
          ...prev,
          {
            messageId: `ai-${Date.now()}`,
            role: 'ASSISTANT',
            content: accumulated,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="AI 챗봇"
        showBackButton
        onBackClick={() => router.back()}
      />

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.empty}>
            <p>불러오는 중...</p>
          </div>
        ) : messages.length === 0 && !streamingContent ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">smart_toy</span>
            <p>계약서에 대해 궁금한 점을 물어보세요</p>
          </div>
        ) : (
          <div className={styles.messages}>
            <div ref={topSentinelRef} />
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
                  {msg.role === 'USER' ? (
                    <div className={styles.userMessage}>
                      <div className={styles.userBubble}>{msg.content}</div>
                      <span className={styles.time}>{time}</span>
                    </div>
                  ) : (
                    <div className={styles.aiBubbleWrapper}>
                      <div className={styles.aiAvatar}>
                        <span className="material-symbols-outlined">
                          smart_toy
                        </span>
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
          disabled={isStreaming || isLoading}
          placeholder="계약서에 대해 질문해보세요"
        />
      </div>
    </div>
  );
}
