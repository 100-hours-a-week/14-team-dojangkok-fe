'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { Client } from '@stomp/stompjs';
import { ensureValidToken } from '@/lib/api/client';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import {
  getChatRoomDetail,
  getChatMessages,
  getPresignedUrls,
  completeUpload,
} from '@/lib/api/chat';
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
  ImageContent,
  VideoContent,
} from '@/types/chat';

const SEND_TIMEOUT_MS = 5000;
const VIDEO_EXTENSIONS =
  /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv|ts|mts|m2ts|ogv)$/i;

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  if (!file.type) return VIDEO_EXTENSIONS.test(file.name);
  return false;
}

interface UseStompChatResult {
  messages: ChatMessage[];
  roomDetail: ChatRoom | null;
  isLoading: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  loadMore: () => void;
  sendText: (text: string) => void;
  sendImages: (files: File[]) => void;
  retryMessage: (localId: string) => void;
  cancelMessage: (localId: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  topSentinelRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

function sortByCreatedAt(msgs: ChatMessage[]): ChatMessage[] {
  return [...msgs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

function getVideoMeta(
  url: string
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () =>
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    video.onerror = () => resolve({ width: 0, height: 0, duration: 0 });
    video.src = url;
  });
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
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const fileMapRef = useRef<Map<string, File>>(new Map());
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
    setIsFetchingMore(true);

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
      setIsFetchingMore(false);
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
  const lastMsg = messages[messages.length - 1];
  const lastMsgKey = lastMsg?.messageId || lastMsg?.localId;
  const isLastMsgMine = lastMsg?.mine ?? false;
  const prevLastMsgKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (lastMsgKey && lastMsgKey !== prevLastMsgKeyRef.current) {
      prevLastMsgKeyRef.current = lastMsgKey;
      if (messages.length > prevLengthRef.current) {
        const container = scrollContainerRef.current;
        const nearBottom =
          !container ||
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <=
            100;
        // 내 메시지이거나, 하단 100px 이내에 있을 때만 자동 스크롤
        if (isLastMsgMine || nearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevLengthRef.current = messages.length;
  }, [lastMsgKey, messages.length, isLastMsgMine]);

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
      // 에코: 텍스트 내용으로 먼저 매칭, 없으면 첫 번째 미확정 메시지에 messageId 업데이트
      setMessages((prev) => {
        const echoText =
          event.contentType === 'TEXT'
            ? (event.content as TextContent).text
            : null;

        let idx = -1;
        if (echoText !== null) {
          idx = prev.findIndex(
            (m) =>
              m.localId &&
              !m.messageId &&
              m.contentType === 'TEXT' &&
              (m.content as TextContent).text === echoText
          );
        }
        if (idx === -1) {
          idx = prev.findIndex((m) => m.localId && !m.messageId);
        }
        if (idx === -1) return prev;

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
        const timer = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.localId === localId ? { ...m, isFailed: true } : m
            )
          );
          pendingRef.current.delete(localId);
        }, SEND_TIMEOUT_MS);
        pendingRef.current.set(localId, timer);
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

  const sendImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const groupId =
        files.length > 1 ? `group-${Date.now()}-${Math.random()}` : null;

      // 1. 낙관적 메시지 + blob URL 생성
      const items = files.map((file) => {
        const localId = `local-${Date.now()}-${Math.random()}`;
        const localUrl = URL.createObjectURL(file);
        const isVideo = isVideoFile(file);
        const optimistic: ChatMessage = {
          messageId: '',
          roomId,
          senderId: myUserId,
          mine: true,
          contentType: isVideo ? 'VIDEO' : 'IMAGE',
          content: isVideo
            ? ({
                url: localUrl,
                thumbnailUrl: localUrl,
                duration: 0,
                width: 0,
                height: 0,
                size: file.size,
              } as VideoContent)
            : ({
                url: localUrl,
                thumbnailUrl: localUrl,
                width: 0,
                height: 0,
                size: file.size,
              } as ImageContent),
          groupId,
          createdAt: new Date().toISOString(),
          localId,
          isRead: false,
          isFailed: false,
        };
        fileMapRef.current.set(localId, file);
        return { file, localId, localUrl, optimistic, isVideo };
      });

      setMessages((prev) => [...prev, ...items.map((i) => i.optimistic)]);
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });

      try {
        // 2. dimensions + presigned URL 병렬 처리
        const [metaList, { fileItems: presignedFiles }] = await Promise.all([
          Promise.all(
            items.map((i) =>
              i.isVideo
                ? getVideoMeta(i.localUrl)
                : getImageDimensions(i.localUrl).then((d) => ({
                    ...d,
                    duration: 0,
                  }))
            )
          ),
          getPresignedUrls(
            roomId,
            items.map((i) => ({
              fileType: i.isVideo ? ('VIDEO' as const) : ('IMAGE' as const),
              fileName: i.file.name,
              contentType: i.file.type,
              sizeBytes: i.file.size,
            }))
          ),
        ]);

        // 3. S3 업로드 병렬 처리
        const uploadResults = await Promise.all(
          items.map(async (item, idx) => {
            const res = await fetch(presignedFiles[idx].presignedUrl, {
              method: 'PUT',
              body: item.file,
              headers: { 'Content-Type': item.file.type },
            });
            if (!res.ok) throw new Error(`S3 upload failed: ${item.file.name}`);
            return presignedFiles[idx].fileAssetId;
          })
        );

        // 4. complete 한 번에 처리
        const { fileItems: completedFiles } =
          await completeUpload(uploadResults);

        if (!clientRef.current?.connected) throw new Error('Not connected');

        // 5. STOMP 전송 + 낙관적 메시지 URL 업데이트
        items.forEach((item, idx) => {
          const finalUrl = completedFiles[idx].presignedUrl;
          const meta = metaList[idx];

          const stompBody = item.isVideo
            ? {
                roomId,
                contentType: 'VIDEO',
                ...(groupId ? { groupId } : {}),
                url: finalUrl,
                width: meta.width,
                height: meta.height,
                duration: meta.duration,
                size: item.file.size,
              }
            : {
                roomId,
                contentType: 'IMAGE',
                ...(groupId ? { groupId } : {}),
                url: finalUrl,
                width: meta.width,
                height: meta.height,
                size: item.file.size,
              };

          clientRef.current!.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(stompBody),
          });

          setMessages((prev) =>
            prev.map((m) => {
              if (m.localId !== item.localId) return m;
              if (item.isVideo) {
                return {
                  ...m,
                  content: {
                    ...(m.content as VideoContent),
                    url: finalUrl,
                    thumbnailUrl: finalUrl,
                    width: meta.width,
                    height: meta.height,
                    duration: meta.duration,
                  },
                  isFailed: false,
                };
              }
              return {
                ...m,
                content: {
                  ...(m.content as ImageContent),
                  url: finalUrl,
                  thumbnailUrl: finalUrl,
                  width: meta.width,
                  height: meta.height,
                },
                isFailed: false,
              };
            })
          );

          URL.revokeObjectURL(item.localUrl);
          fileMapRef.current.delete(item.localId);
        });

        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      } catch {
        items.forEach((item) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.localId === item.localId ? { ...m, isFailed: true } : m
            )
          );
          URL.revokeObjectURL(item.localUrl);
        });
      }
    },
    [roomId, myUserId]
  );

  const retryMessage = useCallback(
    (localId: string) => {
      const msg = messages.find((m) => m.localId === localId);
      if (!msg) return;

      setMessages((prev) => prev.filter((m) => m.localId !== localId));

      if (msg.contentType === 'IMAGE' || msg.contentType === 'VIDEO') {
        const file = fileMapRef.current.get(localId);
        if (file) {
          fileMapRef.current.delete(localId);
          sendImages([file]);
        }
      } else {
        const text = (msg.content as TextContent).text;
        sendText(text);
      }
    },
    [messages, sendText, sendImages]
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
    isFetchingMore,
    loadMore,
    sendText,
    sendImages,
    retryMessage,
    cancelMessage,
    messagesEndRef,
    topSentinelRef,
    scrollContainerRef,
  };
}
