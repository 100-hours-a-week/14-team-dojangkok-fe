# Health Check API 명세서

**Base URL**: `https://dojangkok.cloud`

---

## 엔드포인트 목록

| Method | Endpoint                 | 설명           | 용도            |
| ------ | ------------------------ | -------------- | --------------- |
| GET    | `/health-check`          | 기본 헬스체크  | 로드밸런서      |
| GET    | `/health-check/detailed` | 상세 서버 정보 | 모니터링 시스템 |

---

## 1. 기본 헬스체크

### `GET /health-check`

서버가 정상적으로 실행 중인지 확인하는 간단한 헬스체크 엔드포인트입니다.

#### 요청

```bash
GET /health-check
```

**헤더**: 없음
**파라미터**: 없음
**인증**: 불필요

#### 응답

**성공 응답 (200 OK)**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T00:29:21.449Z"
}
```

**실패 응답 (503 Service Unavailable)**

```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-30T00:29:21.449Z",
  "error": "Internal server error"
}
```

#### 응답 필드

| 필드        | 타입   | 설명                                   |
| ----------- | ------ | -------------------------------------- |
| `status`    | string | 서버 상태 (`healthy` 또는 `unhealthy`) |
| `timestamp` | string | ISO 8601 형식의 현재 시각              |
| `error`     | string | (선택) 오류 발생 시 에러 메시지        |

#### 상태 코드

| 코드 | 설명                               |
| ---- | ---------------------------------- |
| 200  | 서버가 정상적으로 작동 중          |
| 503  | 서버에 문제가 발생하여 서비스 불가 |

#### 사용 예시

**cURL**

```bash
curl -X GET https://dojangkok.cloud/health-check
```

---

## 2. 상세 헬스체크

### `GET /health-check/detailed`

서버의 상세한 리소스 정보를 제공하는 엔드포인트입니다.

#### 요청

```bash
GET /health-check/detailed
```

**헤더**: 없음
**파라미터**: 없음
**인증**: 불필요

#### 응답

**성공 응답 (200 OK)**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T00:29:27.664Z",
  "server": {
    "nodejs": "v22.19.0",
    "platform": "darwin",
    "arch": "arm64",
    "uptime": {
      "seconds": 20048,
      "formatted": "5h 34m 8s"
    }
  },
  "memory": {
    "rss": {
      "bytes": 817627136,
      "mb": 780
    },
    "heapTotal": {
      "bytes": 217841664,
      "mb": 208
    },
    "heapUsed": {
      "bytes": 210626232,
      "mb": 201
    },
    "external": {
      "bytes": 6112939,
      "mb": 6
    }
  },
  "environment": {
    "nodeEnv": "development",
    "nextPublicAppUrl": "http://localhost:3000"
  }
}
```

**실패 응답 (503 Service Unavailable)**

```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-30T00:29:27.664Z",
  "error": "Internal server error"
}
```

#### 응답 필드

| 필드                           | 타입   | 설명                                            |
| ------------------------------ | ------ | ----------------------------------------------- |
| `status`                       | string | 서버 상태 (`healthy` 또는 `unhealthy`)          |
| `timestamp`                    | string | ISO 8601 형식의 현재 시각                       |
| `server`                       | object | 서버 환경 정보                                  |
| `server.nodejs`                | string | Node.js 버전                                    |
| `server.platform`              | string | 운영체제 플랫폼 (`linux`, `darwin`, `win32` 등) |
| `server.arch`                  | string | CPU 아키텍처 (`x64`, `arm64` 등)                |
| `server.uptime`                | object | 서버 업타임 정보                                |
| `server.uptime.seconds`        | number | 업타임 (초)                                     |
| `server.uptime.formatted`      | string | 읽기 쉬운 형식의 업타임 (예: `5h 34m 8s`)       |
| `memory`                       | object | 메모리 사용량 정보                              |
| `memory.rss`                   | object | Resident Set Size (물리 메모리 사용량)          |
| `memory.rss.bytes`             | number | RSS (bytes)                                     |
| `memory.rss.mb`                | number | RSS (MB)                                        |
| `memory.heapTotal`             | object | V8 힙 전체 크기                                 |
| `memory.heapTotal.bytes`       | number | Heap Total (bytes)                              |
| `memory.heapTotal.mb`          | number | Heap Total (MB)                                 |
| `memory.heapUsed`              | object | V8 힙 사용량                                    |
| `memory.heapUsed.bytes`        | number | Heap Used (bytes)                               |
| `memory.heapUsed.mb`           | number | Heap Used (MB)                                  |
| `memory.external`              | object | V8이 관리하는 C++ 객체에 바인딩된 메모리        |
| `memory.external.bytes`        | number | External (bytes)                                |
| `memory.external.mb`           | number | External (MB)                                   |
| `environment`                  | object | 환경 변수 정보                                  |
| `environment.nodeEnv`          | string | Node 환경 (`development`, `production` 등)      |
| `environment.nextPublicAppUrl` | string | 애플리케이션 URL                                |

#### 상태 코드

| 코드 | 설명                               |
| ---- | ---------------------------------- |
| 200  | 서버가 정상적으로 작동 중          |
| 503  | 서버에 문제가 발생하여 서비스 불가 |

#### 사용 예시

**cURL**

```bash
curl -X GET https://dojangkok.cloud/health-check/detailed
```
