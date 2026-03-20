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

const CHAT_API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8081/api';

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
  await ensureValidToken();
  const res = await apiClient<CreateOrGetChatRoomResponse>(
    `${CHAT_API_BASE_URL}/chat/v3/direct-chat/rooms`,
    {
      method: 'POST',
      body: JSON.stringify({ targetUserId, propertyId }),
      requiresAuth: true,
      skipTokenRefresh: true,
    }
  );
  return res.data;
}

export async function getChatRooms(): Promise<ChatRoomsResponse> {
  await ensureValidToken();
  const res = await apiClient<ChatRoomsApiResponse>(
    `${CHAT_API_BASE_URL}/chat/v3/direct-chat/rooms`,
    {
      requiresAuth: true,
      skipTokenRefresh: true,
    }
  );
  return res.data;
}

export async function getChatRoomDetail(roomId: string): Promise<ChatRoom> {
  await ensureValidToken();
  const res = await apiClient<ChatRoomDetailApiResponse>(
    `${CHAT_API_BASE_URL}/chat/v3/direct-chat/rooms/${roomId}`,
    { requiresAuth: true, skipTokenRefresh: true }
  );
  return res.data;
}

export async function getChatMessages(
  roomId: string,
  before?: string,
  size = 20
): Promise<ChatMessagesResponse> {
  await ensureValidToken();
  const params = new URLSearchParams({ size: String(size) });
  if (before) params.set('before', before);
  const res = await apiClient<ChatMessagesApiResponse>(
    `${CHAT_API_BASE_URL}/chat/v3/direct-chat/rooms/${roomId}/messages?${params.toString()}`,
    { requiresAuth: true, skipTokenRefresh: true }
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
  }>(`${CHAT_API_BASE_URL}/chat/v3/direct-chat/files/presigned-urls`, {
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
  }>(`${CHAT_API_BASE_URL}/chat/v3/direct-chat/files/complete`, {
    method: 'POST',
    body: JSON.stringify({ fileAssetIds }),
    requiresAuth: true,
  });
  return res.data;
}

export interface AiChatRoom {
  roomId: string;
  createdAt: string;
}

export interface AiChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  contentType: 'TEXT';
  content: { text: string };
  createdAt: string;
}

export interface AiChatMessagesResponse {
  messages: AiChatMessage[];
  hasNext: boolean;
  nextCursor: string | null;
}

export async function createOrGetAiChatRoom(
  easyContractId: string
): Promise<AiChatRoom> {
  await ensureValidToken();
  const res = await apiClient<{
    code: string;
    message: string;
    data: AiChatRoom;
  }>(`${CHAT_API_BASE_URL}/chat/v3/ai-chat/rooms`, {
    method: 'POST',
    body: JSON.stringify({ easyContractId }),
    requiresAuth: true,
    skipTokenRefresh: true,
  });
  return res.data;
}

export async function getAiChatMessages(
  roomId: string,
  before?: string,
  size = 20
): Promise<AiChatMessagesResponse> {
  await ensureValidToken();
  const params = new URLSearchParams({ size: String(size) });
  if (before) params.set('before', before);
  const res = await apiClient<{
    code: string;
    message: string;
    data: AiChatMessagesResponse;
  }>(
    `${CHAT_API_BASE_URL}/chat/v3/ai-chat/rooms/${roomId}/messages?${params.toString()}`,
    { requiresAuth: true, skipTokenRefresh: true }
  );
  return res.data;
}

/**
 * AI 채팅 SSE 스트리밍
 * 스펙: POST /api/chat/v3/ai-chat/rooms/{roomId}/chat
 * 응답 형식: {"text": "...", "done": false}
 */
export async function streamAiChat(
  roomId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const hasToken = await ensureValidToken();
  if (!hasToken) return;

  const token = tokenStorage.getAccessToken();

  const response = await fetch(
    `${CHAT_API_BASE_URL}/chat/v3/ai-chat/rooms/${roomId}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
      signal,
    }
  );

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
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.done) {
          onDone();
          return;
        }
        if (parsed.text) onChunk(parsed.text);
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }

  onDone();
}
