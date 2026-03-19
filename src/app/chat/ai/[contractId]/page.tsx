'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/common/Header';
import MessageInput from '@/components/chat/MessageInput';
import DateDivider from '@/components/chat/DateDivider';
import { streamAiChat } from '@/lib/api/chat';
import styles from './page.module.css';

interface AiMessage {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export default function AiChatPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.contractId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSend = async (question: string) => {
    if (isStreaming) return;

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
        contractId,
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
      // 스트리밍 실패 시 누적된 내용이 있으면 메시지로 추가
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
          disabled={isStreaming}
          placeholder="계약서에 대해 질문해보세요"
        />
      </div>
    </div>
  );
}
