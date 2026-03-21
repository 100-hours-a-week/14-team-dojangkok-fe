'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { Client } from '@stomp/stompjs';
import { ensureValidToken } from '@/lib/api/client';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { getChatRoomDetail, getChatMessages } from '@/lib/api/chat';
import {
  createStompClient,
  getWsUrl,
  publishRead,
} from '@/lib/chat/stompClient';
import type {
  ChatMessage,
  ChatRoom,
  StompEvent,
  StompMessageEvent,
  StompReadEvent,
  TextContent,
} from '@/types/chat';

const SEND_TIMEOUT_MS = 5000;

interface UseStompChatResult {
  messages: ChatMessage[];
  roomDetail: ChatRoom | null;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  sendText: (text: string) => void;
  retryMessage: (localId: string) => void;
  cancelMessage: (localId: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  topSentinelRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

function sortByCreatedAt(msgs: ChatMessage[]): ChatMessage[] {
  return [...msgs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function calcIsRead(
  msg: ChatMessage,
  partnerLastReadAt: string | null
): boolean {
  if (!msg.mine || !partnerLastReadAt) return false;
  return msg.createdAt <= partnerLastReadAt;
}

export function useStompChat(
  roomId: string,
  myUserId: string
): UseStompChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomDetail, setRoomDetail] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const partnerLastReadAtRef = useRef<string | null>(null);
  const isFetchingMoreRef = useRef(false);
  const initialScrollDone = useRef(false);
  const prevLengthRef = useRef(0);

  // 이전 메시지 로드
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMoreRef.current || !nextCursor) return;
    isFetchingMoreRef.current = true;

    const scrollContainer = scrollContainerRef.current;
    const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;

    try {
      const data = await getChatMessages(roomId, nextCursor);
      const withRead = data.messages.map((msg) => ({
        ...msg,
        isRead: calcIsRead(msg, partnerLastReadAtRef.current),
      }));

      setMessages((prev) => sortByCreatedAt([...withRead, ...prev]));
      setHasMore(data.hasNext);
      setNextCursor(data.nextCursor);

      // 스크롤 위치 보정 (이전 메시지 로드 후 현재 보던 위치 유지)
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop =
            scrollContainer.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // 실패 시 무시
    } finally {
      isFetchingMoreRef.current = false;
    }
  }, [hasMore, nextCursor, roomId]);

  // 초기 데이터 로드
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const [detail, msgData] = await Promise.all([
          getChatRoomDetail(roomId),
          getChatMessages(roomId),
        ]);

        if (cancelled) return;

        setRoomDetail(detail);
        partnerLastReadAtRef.current = detail.partnerLastReadAt ?? null;

        const withRead = msgData.messages.map((msg) => ({
          ...msg,
          isRead: calcIsRead(msg, partnerLastReadAtRef.current),
        }));

        setMessages(sortByCreatedAt(withRead));
        setHasMore(msgData.hasNext);
        setNextCursor(msgData.nextCursor);
      } catch {
        // 에러는 상위에서 toast로 처리 가능
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // 초기 로드 완료 후 최하단 스크롤
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoading, messages.length]);

  // 새 메시지 수신 후 최하단 스크롤 (이전 메시지 로드 시는 제외)
  const lastMessageId = messages[messages.length - 1]?.messageId;
  const lastLocalId = messages[messages.length - 1]?.localId;
  const lastMsgKey = lastMessageId || lastLocalId;
  const prevLastMsgKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (lastMsgKey && lastMsgKey !== prevLastMsgKeyRef.current) {
      prevLastMsgKeyRef.current = lastMsgKey;
      // 마지막 메시지가 새로 추가된 경우만 스크롤
      if (messages.length > prevLengthRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevLengthRef.current = messages.length;
  }, [lastMsgKey, messages.length]);

  // STOMP 연결
  useEffect(() => {
    if (!myUserId) return;

    let client: Client | null = null;
    let active = true;

    async function connect() {
      const hasToken = await ensureValidToken();
      if (!hasToken || !active) return;

      const token = tokenStorage.getAccessToken();
      if (!token) return;

      client = createStompClient({
        wsUrl: getWsUrl(),
        token,
        roomId,
        onConnect: () => {},
        onMessage: handleStompEvent,
        onDisconnect: () => {},
        onError: () => {},
      });

      clientRef.current = client;
      client.activate();
    }

    connect();

    const pending = pendingRef.current;
    return () => {
      active = false;
      client?.deactivate();
      clientRef.current = null;
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myUserId]);

  // 위로 스크롤 감지 (IntersectionObserver)
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetchingMoreRef.current
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  function handleStompEvent(event: StompEvent) {
    if (event.type === 'MESSAGE') {
      handleMessageEvent(event as StompMessageEvent);
    } else if (event.type === 'READ') {
      handleReadEvent(event as StompReadEvent);
    }
  }

  function handleMessageEvent(event: StompMessageEvent) {
    const isMine = event.senderId === myUserId;

    if (isMine) {
      // 에코: localId 있는 미확정 메시지에 messageId 업데이트
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.localId && !m.messageId);
        if (idx === -1) {
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          messageId: event.messageId,
          isFailed: false,
        };
        return updated;
      });
    } else {
      // 상대방 메시지 (createdAt 기준 정렬 삽입)
      setMessages((prev) =>
        sortByCreatedAt([...prev, eventToMessage(event, false)])
      );
      if (clientRef.current?.connected) {
        publishRead(clientRef.current, roomId, event.messageId);
      }
    }
  }

  function handleReadEvent(event: StompReadEvent) {
    partnerLastReadAtRef.current = event.lastReadAt;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.mine && msg.createdAt <= event.lastReadAt) {
          return { ...msg, isRead: true };
        }
        return msg;
      })
    );
  }

  function eventToMessage(
    event: StompMessageEvent,
    mine: boolean
  ): ChatMessage {
    return {
      messageId: event.messageId,
      roomId: event.roomId,
      senderId: event.senderId,
      mine,
      contentType: event.contentType,
      content: event.content,
      groupId: event.groupId,
      createdAt: event.createdAt,
      isRead: false,
    };
  }

  const sendText = useCallback(
    (text: string) => {
      const localId = `local-${Date.now()}-${Math.random()}`;
      const optimistic: ChatMessage = {
        messageId: '',
        roomId,
        senderId: myUserId,
        mine: true,
        contentType: 'TEXT',
        content: { text } as TextContent,
        groupId: null,
        createdAt: new Date().toISOString(),
        localId,
        isRead: false,
        isFailed: false,
      };

      setMessages((prev) => [...prev, optimistic]);

      if (!clientRef.current?.connected) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.localId === localId ? { ...m, isFailed: true } : m
            )
          );
        }, SEND_TIMEOUT_MS);
        return;
      }

      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          roomId,
          contentType: 'TEXT',
          text,
        }),
      });

      // publish 성공 → 즉시 전송 확정 (echo 의존하지 않음)
      // echo가 오면 handleMessageEvent에서 messageId만 업데이트
      setMessages((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, isFailed: false } : m))
      );
    },
    [roomId, myUserId]
  );

  const retryMessage = useCallback(
    (localId: string) => {
      const msg = messages.find((m) => m.localId === localId);
      if (!msg) return;
      const text = (msg.content as TextContent).text;
      setMessages((prev) => prev.filter((m) => m.localId !== localId));
      sendText(text);
    },
    [messages, sendText]
  );

  const cancelMessage = useCallback((localId: string) => {
    setMessages((prev) => prev.filter((m) => m.localId !== localId));
    const timer = pendingRef.current.get(localId);
    if (timer) {
      clearTimeout(timer);
      pendingRef.current.delete(localId);
    }
  }, []);

  return {
    messages,
    roomDetail,
    isLoading,
    hasMore,
    loadMore,
    sendText,
    retryMessage,
    cancelMessage,
    messagesEndRef,
    topSentinelRef,
    scrollContainerRef,
  };
}
