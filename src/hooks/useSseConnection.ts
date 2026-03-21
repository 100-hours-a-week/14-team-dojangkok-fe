'use client';

import { useEffect, useRef } from 'react';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { ensureValidToken } from '@/lib/api/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const LAST_EVENT_ID_STORAGE_KEY = 'sse_last_event_id';

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
  const onEventRef = useRef(onEvent);
  const lastEventIdRef = useRef<string | null>(null); // 폴백 모드 전용

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // ─── SharedWorker 지원 환경 ───────────────────────────────
    if (typeof SharedWorker !== 'undefined') {
      const worker = new SharedWorker('/sse.worker.js');
      const port = worker.port;

      async function init() {
        const hasToken = await ensureValidToken();
        if (!hasToken) return;

        const tok = tokenStorage.getAccessToken();
        if (!tok) return;

        const lastEventId = localStorage.getItem(LAST_EVENT_ID_STORAGE_KEY);
        port.postMessage({
          type: 'INIT',
          token: tok,
          apiBaseUrl: API_BASE_URL,
          ...(lastEventId ? { lastEventId } : {}),
        });
      }

      port.onmessage = async (e: MessageEvent) => {
        const { type, ...data } = e.data as {
          type: string;
          [k: string]: unknown;
        };

        if (type === 'SSE_EVENT') {
          onEventRef.current(data.event as SseEvent);
        } else if (type === 'LAST_EVENT_ID') {
          localStorage.setItem(LAST_EVENT_ID_STORAGE_KEY, data.id as string);
        } else if (type === 'REQUEST_TOKEN') {
          const hasToken = await ensureValidToken();
          if (!hasToken) return;
          const tok = tokenStorage.getAccessToken();
          if (tok) {
            port.postMessage({ type: 'UPDATE_TOKEN', token: tok });
          }
        }
      };

      port.start();
      init();

      return () => {
        port.close();
      };
    }

    // ─── 폴백: 기존 fetch 방식 (iOS Safari 등 SharedWorker 미지원) ──
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

      const tok = tokenStorage.getAccessToken();
      if (!tok) return;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${tok}`,
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
