import { Client } from '@stomp/stompjs';
import type { StompEvent } from '@/types/chat';

const CHAT_API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:8081/api';

export function getWsUrl(): string {
  return CHAT_API_BASE_URL.replace(/^http/, 'ws') + '/chat/ws';
}

interface CreateStompClientParams {
  wsUrl: string;
  token: string;
  roomId: string;
  onConnect: () => void;
  onMessage: (event: StompEvent) => void;
  onDisconnect: () => void;
  onError: (err: unknown) => void;
}

export function createStompClient({
  wsUrl,
  token,
  roomId,
  onConnect,
  onMessage,
  onDisconnect,
  onError,
}: CreateStompClientParams): Client {
  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      // 개인 메시지 큐 구독
      client.subscribe('/user/queue/messages', (frame) => {
        try {
          const event: StompEvent = JSON.parse(frame.body);
          if (event.roomId === roomId) {
            onMessage(event);
          }
        } catch (e) {
          onError(e);
        }
      });

      // 읽음 알림 큐 구독
      client.subscribe('/user/queue/notifications', (frame) => {
        try {
          const event: StompEvent = JSON.parse(frame.body);
          if (event.roomId === roomId) {
            onMessage(event);
          }
        } catch (e) {
          onError(e);
        }
      });

      onConnect();
    },
    onDisconnect: () => {
      onDisconnect();
    },
    onStompError: (frame) => {
      onError(frame);
    },
    onWebSocketError: (event) => {
      onError(event);
    },
  });

  return client;
}

export function publishMessage(
  client: Client,
  roomId: string,
  content: string
): void {
  client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({
      roomId,
      contentType: 'TEXT',
      content: { text: content },
    }),
  });
}

export function publishRead(client: Client, roomId: string): void {
  client.publish({
    destination: '/app/chat.read',
    body: JSON.stringify({ roomId }),
  });
}
