'use strict';

/**
 * SSE SharedWorker
 *
 * 여러 탭이 공유하는 단일 SSE 연결을 담당한다.
 * 각 탭은 MessagePort 로 연결되며, SSE 이벤트는 모든 포트에 브로드캐스트된다.
 *
 * 탭 → Worker 메시지
 *   INIT         { token, apiBaseUrl, lastEventId? }  최초 연결 + 정보 전달
 *   UPDATE_TOKEN { token }                            토큰 갱신 응답
 *
 * Worker → 탭 메시지
 *   SSE_EVENT      { event }   수신한 SSE 이벤트
 *   LAST_EVENT_ID  { id }      이벤트 ID (탭이 localStorage 에 저장해 Worker 재시작 시 복구)
 *   REQUEST_TOKEN  {}          401 수신 시 토큰 갱신 요청
 */

let ports = [];
let token = null;
let apiBaseUrl = null;
let lastEventId = null;
let active = false;
let reader = null;
let reconnectTimer = null;

// 토큰 갱신 Promise (REQUEST_TOKEN → UPDATE_TOKEN 흐름)
let tokenRefreshResolve = null;
let tokenRefreshPromise = null;

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function parseSseEvent(raw) {
  if (!raw.trim()) return null;
  let id = null;
  let name = 'message';
  let data = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('id:')) id = line.slice(3).trim();
    else if (line.startsWith('event:')) name = line.slice(6).trim();
    else if (line.startsWith('data:')) data = line.slice(5).trim();
  }
  return { name, data, id };
}

function broadcast(message) {
  const alive = [];
  for (const port of ports) {
    try {
      port.postMessage(message);
      alive.push(port);
    } catch {
      // 탭이 닫혀 포트가 죽은 경우 제거
    }
  }
  ports = alive;
}

function scheduleReconnect(delay = 3000) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function requestTokenRefresh() {
  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = new Promise((resolve) => {
    tokenRefreshResolve = resolve;
  });

  // 살아있는 첫 번째 포트에만 요청 (중복 갱신 방지)
  for (const port of ports) {
    try {
      port.postMessage({ type: 'REQUEST_TOKEN' });
      break;
    } catch {
      // 죽은 포트 건너뜀
    }
  }

  return tokenRefreshPromise;
}

// ─────────────────────────────────────────
// SSE 연결
// ─────────────────────────────────────────

async function connect() {
  if (!token || !apiBaseUrl || ports.length === 0) return;
  if (active) return;
  active = true;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'text/event-stream',
  };
  if (lastEventId) {
    headers['Last-Event-ID'] = lastEventId;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v2/sse/connection`, {
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      active = false;
      const newToken = await requestTokenRefresh();
      token = newToken;
      connect();
      return;
    }

    if (!response.ok || !response.body) {
      active = false;
      scheduleReconnect();
      return;
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (ports.length > 0) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const event = parseSseEvent(part);
        if (!event) continue;
        if (event.id) {
          lastEventId = event.id;
          broadcast({ type: 'LAST_EVENT_ID', id: event.id });
        }
        broadcast({ type: 'SSE_EVENT', event });
      }
    }

    active = false;
    scheduleReconnect();
  } catch {
    active = false;
    scheduleReconnect();
  }
}

// ─────────────────────────────────────────
// 포트 연결 처리
// ─────────────────────────────────────────

self.onconnect = (e) => {
  const port = e.ports[0];
  ports.push(port);

  port.onmessage = (ev) => {
    const { type, ...data } = ev.data;

    if (type === 'INIT') {
      token = data.token;
      apiBaseUrl = data.apiBaseUrl;
      if (data.lastEventId) lastEventId = data.lastEventId;
      if (!active) connect();
    } else if (type === 'UPDATE_TOKEN') {
      token = data.token;
      if (tokenRefreshResolve) {
        tokenRefreshResolve(data.token);
        tokenRefreshResolve = null;
        tokenRefreshPromise = null;
      }
    }
  };

  port.start();
};
