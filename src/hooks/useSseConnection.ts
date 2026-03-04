'use client';

import { useEffect, useRef } from 'react';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { ensureValidToken } from '@/lib/api/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface SseEvent {
  name: string;
  data: string;
  id: string | null;
}

function parseSseEvent(raw: string): SseEvent | null {
  if (!raw.trim()) return null;

  let id: string | null = null;
  let name = 'message';
  let data = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('id:')) {
      id = line.slice(3).trim();
    } else if (line.startsWith('event:')) {
      name = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.slice(5).trim();
    }
  }

  return { name, data, id };
}

export function useSseConnection(
  isAuthenticated: boolean,
  onEvent: (event: SseEvent) => void
) {
  const lastEventIdRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleReconnect(delay = 3000) {
      if (!active) return;
      reconnectTimer = setTimeout(connect, delay);
    }

    async function connect() {
      if (!active) return;

      const hasToken = await ensureValidToken();
      if (!hasToken || !active) return;

      const token = tokenStorage.getAccessToken();
      if (!token) return;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      };

      if (lastEventIdRef.current) {
        headers['Last-Event-ID'] = lastEventIdRef.current;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v2/sse/connection`, {
          headers,
          credentials: 'include',
        });

        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const event = parseSseEvent(part);
            if (!event) continue;
            if (event.id) lastEventIdRef.current = event.id;
            onEventRef.current(event);
          }
        }

        scheduleReconnect();
      } catch {
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reader?.cancel().catch(() => {});
    };
  }, [isAuthenticated]);
}
