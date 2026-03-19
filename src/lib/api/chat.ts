import { apiClient } from './client';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { ensureValidToken } from './client';
import type {
  ChatRoom,
  ChatRoomsResponse,
  ChatMessagesResponse,
  FileItem,
  PresignedResponse,
  CompleteResponse,
} from '@/types/chat';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface CreateOrGetChatRoomResponse {
  code: string;
  message: string;
  data: ChatRoom;
}

export interface ChatRoomsApiResponse {
  code: string;
  message: string;
  data: ChatRoomsResponse;
}

export interface ChatRoomDetailApiResponse {
  code: string;
  message: string;
  data: ChatRoom;
}

export interface ChatMessagesApiResponse {
  code: string;
  message: string;
  data: ChatMessagesResponse;
}

export async function createOrGetChatRoom(
  targetUserId: string,
  propertyId: number
): Promise<ChatRoom> {
  const res = await apiClient<CreateOrGetChatRoomResponse>(
    '/chat/v3/direct-chat/rooms',
    {
      method: 'POST',
      body: JSON.stringify({ targetUserId, propertyId }),
      requiresAuth: true,
    }
  );
  return res.data;
}

export async function getChatRooms(): Promise<ChatRoomsResponse> {
  const res = await apiClient<ChatRoomsApiResponse>(
    '/chat/v3/direct-chat/rooms',
    {
      requiresAuth: true,
    }
  );
  return res.data;
}

export async function getChatRoomDetail(roomId: string): Promise<ChatRoom> {
  const res = await apiClient<ChatRoomDetailApiResponse>(
    `/chat/v3/direct-chat/rooms/${roomId}`,
    { requiresAuth: true }
  );
  return res.data;
}

export async function getChatMessages(
  roomId: string,
  before?: string,
  size = 20
): Promise<ChatMessagesResponse> {
  const params = new URLSearchParams({ size: String(size) });
  if (before) params.set('before', before);
  const res = await apiClient<ChatMessagesApiResponse>(
    `/chat/v3/direct-chat/rooms/${roomId}/messages?${params.toString()}`,
    { requiresAuth: true }
  );
  return res.data;
}

export async function getPresignedUrls(
  roomId: string,
  fileItems: FileItem[]
): Promise<PresignedResponse> {
  const res = await apiClient<{
    code: string;
    message: string;
    data: PresignedResponse;
  }>('/chat/v3/direct-chat/files/presigned-urls', {
    method: 'POST',
    body: JSON.stringify({ roomId, files: fileItems }),
    requiresAuth: true,
  });
  return res.data;
}

export async function completeUpload(
  fileAssetIds: string[]
): Promise<CompleteResponse> {
  const res = await apiClient<{
    code: string;
    message: string;
    data: CompleteResponse;
  }>('/chat/v3/direct-chat/files/complete', {
    method: 'POST',
    body: JSON.stringify({ fileAssetIds }),
    requiresAuth: true,
  });
  return res.data;
}

/**
 * AI 채팅 SSE 스트리밍
 * ReadableStream을 직접 반환하여 caller가 처리
 */
export async function streamAiChat(
  contractId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const hasToken = await ensureValidToken();
  if (!hasToken) return;

  const token = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ roomId: contractId, message }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('AI 채팅 연결에 실패했습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      if (!part.trim()) continue;
      for (const line of part.split('\n')) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const text = parsed.content ?? parsed.text ?? parsed.delta ?? data;
            if (text) onChunk(text);
          } catch {
            // 파싱 실패 시 raw data 사용
            if (data) onChunk(data);
          }
        }
      }
    }
  }

  onDone();
}
