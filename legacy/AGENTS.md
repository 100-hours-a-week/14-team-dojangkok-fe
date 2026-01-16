# CLAUDE.md

# Project Documentation (Auto-loaded)
@docs/fe/claude-frontend-guide.md
@docs/fe/FRONTEND_GUIDE.md
@docs/be/LLD.md
@docs/be/API.md

---

## 프로젝트 개요

**프로젝트명**: KTB 커뮤니티 플랫폼 - 프론트엔드
**프로젝트 목적**: 기존 Spring Boot SSR 방식을 Express.js 정적 파일 서빙으로 분리
**현재 상태**: `origin_source/` 디렉토리의 Vanilla JS 정적 파일, Express.js 서버 설정 완료
**인증 방식**: HttpOnly Cookie (토큰) + localStorage (userId)

**백엔드 프로젝트 위치**: `/Users/jsh/IdeaProjects/community` (Spring Boot 3.5.6, Java 24)

---

## 시스템 아키텍처

```
┌─────────────────────────────────────┐
│ Client Browser                       │
│ (HTML/CSS/Vanilla JavaScript)        │
└─────────────────────────────────────┘
           │
           │ 정적 파일 요청 (HTML, CSS, JS)
           ↓
┌─────────────────────────────────────┐
│ Express.js Static File Server       │
│ http://localhost:3000                │
│ - origin_source/static/ 서빙         │
│ - Vanilla JS, HTML, CSS              │
│ - 빌드 시스템 없음                     │
└─────────────────────────────────────┘
           │
           │ REST API 호출 (JWT 인증)
           ↓
┌─────────────────────────────────────┐
│ Spring Boot Backend API Server       │
│ http://localhost:8080                │
│ - JWT Authentication                 │
│ - MySQL Database                     │
│ - AWS S3 Image Storage               │
│ ⚠️ 진행 중: HttpOnly Cookie 전환       │
└─────────────────────────────────────┘
```

**핵심 포인트**:
- Express.js: 정적 파일만 서빙 (SSR 대체)
- Spring Boot: 모든 비즈니스 로직, 데이터베이스, 인증 담당

---

## 프로젝트 맥락

이 프로젝트는 기존 Spring Boot 프로젝트의 **SSR(Server-Side Rendering) 부분만 Express.js 정적 파일 서버로 분리**하는 작업입니다.

**분리 배경**:
- 기존: Spring Boot가 SSR + API 모두 담당
- 목표: Express.js (정적 파일) + Spring Boot (API) 분리
- 이유: 프론트엔드/백엔드 개발 독립성 확보, 배포 분리

**레포지토리 구성**:
- **기존 프론트엔드 자산**: `origin_source/` (Vanilla JS, HTML, CSS)
- **API 문서**: `docs/be/API.md`에 백엔드 API 명세
- **백엔드 설계**: `docs/be/LLD.md`에 상세 설계 문서
- **프론트엔드 가이드**: `docs/fe/` (개발 원칙, API 연동)

**현재 프론트엔드 기술 스택**:
- Vanilla JavaScript (빌드 시스템 없음)
- JWT 인증 (HttpOnly Cookie)
- Spring Boot 백엔드와 REST API 통신
- 컴포넌트 기반 구조의 정적 HTML 페이지

---

## 디렉토리 구조

```
ktb_community_fe/
├── docs/
│   ├── fe/
│   │   ├── claude-frontend-guide.md   # 프론트엔드 개발 원칙
│   │   └── FRONTEND_GUIDE.md         # API 연동 가이드
│   └── be/
│       ├── API.md                     # REST API 명세 (21개 엔드포인트) ⭐ SSOT
│       ├── DDL.md                     # 데이터베이스 스키마 (MySQL)
│       └── LLD.md                     # 백엔드 설계 문서 ⭐ SSOT
├── origin_source/
│   └── static/                        # 정적 자산
│       ├── css/                       # 스타일시트 (common, components, pages)
│       ├── js/                        # JavaScript (common, pages)
│       ├── pages/                     # HTML 페이지 (board, user, fragments)
│       └── test_image/                # 테스트 이미지
├── server.js                          # Express.js 정적 파일 서버
└── package.json                       # Node.js 프로젝트 설정
```

**상세 구조**: [claude-frontend-guide.md](docs/fe/claude-frontend-guide.md#프로젝트-구조-가이드) 참조

---

## 핵심 아키텍처 및 패턴

### 인증 시스템

**현재 구현** (Vanilla JS):
- JWT 기반 인증 (Access Token: 30분, Refresh Token: 7일)
- 토큰은 HttpOnly Cookie로 관리 (XSS 방지)
- userId는 localStorage에 저장 (프론트엔드 UI용)
- 401 에러 시 자동 토큰 갱신 및 localStorage 동기화

**완료된 변경사항**:
- JWT 토큰 → HttpOnly Cookie 전환 완료 (XSS 방지)
- SameSite=Strict 설정 (CSRF 방지)
- 로그인/회원가입/토큰갱신 시 userId localStorage 저장
- `/users/me` 엔드포인트 미사용 (localStorage 활용)

**참조**:
- 백엔드 인증 흐름: [LLD.md Section 6](docs/be/LLD.md#6-인증-및-보안)
- API 명세: [API.md Section 1](docs/be/API.md#1-인증-authentication)
- 클라이언트 구현: [FRONTEND_GUIDE.md Section 2](docs/fe/FRONTEND_GUIDE.md#2-인증-시스템)

### API 통신 패턴

**Base URL**: `http://localhost:8080` (Spring Boot 백엔드)

**표준 응답 구조**: `{ message, data, timestamp }` 형식 - **참조**: [API.md Section 7](docs/be/API.md#7-공통-사양) ⭐ **응답 형식 SSOT**

### 페이지네이션 전략

**하이브리드 방식**:
1. **Cursor 기반** (최신 게시글): 무한 스크롤 - `GET /posts?cursor=123&limit=10&sort=latest`
2. **Offset 기반** (좋아요순, 댓글): 페이지 번호 - `GET /posts?offset=0&limit=10&sort=likes`

**참조**:
- 백엔드 구현: [LLD.md Section 7.3](docs/be/LLD.md#73-페이지네이션)
- API 명세: [API.md Section 3.1](docs/be/API.md#31-게시글-목록-조회)
- 클라이언트 구현: [FRONTEND_GUIDE.md Section 3](docs/fe/FRONTEND_GUIDE.md#3-페이지네이션-전략)

### 에러 처리

**28개 에러 코드**를 도메인별로 분류 (AUTH, USER, POST, COMMENT, LIKE, IMAGE, COMMON)

**참조**: [API.md Section 7](docs/be/API.md#응답-코드) ⭐ **에러 코드 SSOT**

### 컴포넌트 기반 구조

**HTML 조각**: `origin_source/pages/fragments/` (header, post-card, comment-item, modal)
**CSS 아키텍처**: common/, components/, pages/
**JavaScript 구성**: common/ (공유), pages/ (IIFE 패턴)

**참조**: [claude-frontend-guide.md](docs/fe/claude-frontend-guide.md#프로젝트-구조-가이드) (상세 구조)

---

## 개발 가이드라인

### 프론트엔드 개발 원칙

**4가지 핵심 원칙**:
1. **가독성**: 코드가 위에서 아래로 자연스럽게 읽힘
2. **예측 가능성**: 서버 렌더링과 클라이언트 동작의 명확한 구분
3. **응집도**: 관련된 템플릿/스타일/스크립트를 함께 관리
4. **결합도**: JavaScript가 DOM 구조에 최소한으로 의존 (`data-*` 속성 사용)

**참조**: [claude-frontend-guide.md](docs/fe/claude-frontend-guide.md) (상세 가이드라인, 코드 예시, 체크리스트)

### API 연동

**공통 유틸리티**: `origin_source/static/js/common/` (api.js, utils.js, validation.js)

**참조**: [FRONTEND_GUIDE.md](docs/fe/FRONTEND_GUIDE.md) (전체 API 연동 가이드)

### 명명 규칙

**CSS BEM 스타일**: `.card`, `.card__title`, `.card--featured`
**JavaScript**: camelCase (함수), UPPER_SNAKE_CASE (상수), 언더스코어 시작 (private)

---

## API 레퍼런스

**21개 엔드포인트**를 6개 카테고리로 분류:

| 카테고리 | 엔드포인트 수 | 주요 API |
|---------|--------------|----------|
| **인증** | 3개 | POST /auth/login, /logout, /refresh_token |
| **사용자** | 5개 | POST /users/signup, GET/PATCH /users/{id} |
| **게시글** | 5개 | GET /posts (cursor/offset), CRUD |
| **댓글** | 4개 | GET/POST/PATCH/DELETE /posts/{id}/comments |
| **좋아요** | 3개 | POST/DELETE /posts/{id}/like |
| **이미지** | 1개 | POST /images (multipart) |

**참조**: [API.md](docs/be/API.md) ⭐ **전체 API 명세 SSOT**

---

## 데이터베이스 스키마

**MySQL 8.0+** 테이블:
- `users`: 사용자 계정 (email, password_hash, nickname, role, user_status)
- `posts`: 게시글 (post_title, post_content, post_status)
- `comments`: 댓글
- `post_likes`: M:N 관계 (user_id + post_id unique)
- `post_stats`: 비정규화된 통계 (view_count, like_count, comment_count)
- `images`: S3 이미지 메타데이터 (image_url, expires_at for TTL)
- `post_images`: 게시글-이미지 M:N 관계
- `user_tokens`: Refresh Token 저장소

**주요 설계 패턴**:
- Soft delete: `user_status`, `post_status`, `comment_status` enum
- Optimistic update: 조회수는 DB에서 증가시키지만 이전 값 반환 (클라이언트에서 UI에 +1)
- Atomic update: 좋아요/댓글 수는 직접 SQL UPDATE로 race condition 방지

**참조**: [DDL.md](docs/be/DDL.md) (전체 DDL), [LLD.md Section 4](docs/be/LLD.md#4-데이터베이스-설계)

---

## 주요 제약사항

### 입력 검증

| 필드 | 제약사항 |
|------|---------|
| 이메일 | 유효한 형식, 중복 불가 |
| 비밀번호 | 8-20자, 대문자 + 소문자 + 특수문자 |
| 닉네임 | 최대 10자, 중복 불가 |
| 게시글 제목 | 최대 27자 |
| 댓글 | 최대 200자 |
| 이미지 | JPG/PNG/GIF, 5MB 제한 |

**참조**: [FRONTEND_GUIDE.md Section 5](docs/fe/FRONTEND_GUIDE.md#5-입력-검증) (클라이언트 검증), [LLD.md Section 6.4](docs/be/LLD.md#64-비밀번호-정책) (백엔드 검증)

### Rate Limiting (백엔드)

**3단계 전략**:
- Tier 1 (5/분): 로그인, 비밀번호 변경 (brute-force 방지)
- Tier 2 (10-50/분): 회원가입, 토큰 갱신, 게시글/댓글 작성
- Tier 3 (200/분 또는 무제한): 좋아요, 조회

**참조**: [LLD.md Section 6.5](docs/be/LLD.md#65-rate-limiting) (전체 구현 상세)

---

## 일반적인 개발 작업

### 프론트엔드 서버 실행

**사전 요구사항**: `localhost:8080`에서 Spring Boot 백엔드 서버 실행 중

```bash
# Express.js 정적 파일 서버 실행 (권장)
npm install
npm run dev   # 개발 모드 (자동 재시작)
# 또는
npm start     # 일반 모드

# 접속: http://localhost:3000/pages/user/login.html
```

**대안 (Python):**
```bash
python3 -m http.server 8000
# 접속: http://localhost:8000/pages/user/login.html
```

### API 호출 테스트

**참조**: [FRONTEND_GUIDE.md Section 7.3](docs/fe/FRONTEND_GUIDE.md#73-브라우저-콘솔-테스트) (브라우저 콘솔 테스트 예시)

### 일반적인 문제

**CORS 에러**: 백엔드 CORS 설정에 프론트엔드 URL 추가
**401 Unauthorized**: Chrome DevTools → Application → Cookies → `localhost:8080`에서 `access_token`, `refresh_token` 존재 확인
**이미지 업로드 실패**: 파일 크기(5MB), 타입(JPG/PNG/GIF), 백엔드 S3 자격증명 확인

---

## 참고할 중요 파일

### 인증 작업 시
- `origin_source/static/js/common/api.js`: JWT 로직
- [API.md Section 1](docs/be/API.md#1-인증-authentication): 인증 엔드포인트 명세
- [LLD.md Section 6](docs/be/LLD.md#6-인증-및-보안): JWT 구현 상세

### 게시글/댓글 작업 시
- `origin_source/static/js/pages/board/*.js`: 게시글 로직
- [API.md Section 3, 5](docs/be/API.md#3-게시글-posts): 게시글/댓글 명세
- [LLD.md Section 7](docs/be/LLD.md#7-주요-비즈니스-로직): 비즈니스 로직 상세

### 페이지네이션 작업 시
- [API.md Section 3.1](docs/be/API.md#31-게시글-목록-조회): 하이브리드 페이지네이션 설명
- [FRONTEND_GUIDE.md Section 3](docs/fe/FRONTEND_GUIDE.md#3-페이지네이션-전략): 클라이언트 구현 예시

### 파일 업로드 작업 시
- `origin_source/static/js/common/api.js::uploadImage()`
- [API.md Section 4](docs/be/API.md#4-이미지-images): 이미지 업로드 명세
- [LLD.md Section 7.5](docs/be/LLD.md#75-이미지-업로드-전략): TTL 패턴 상세

---

## Git 워크플로우

**저장소**: `https://github.com/WAFriend3416/waf-3-community-fe.git`
**브랜치**: `main`

**커밋 메시지 규칙**:
- `feat: 사용자 프로필 편집 추가`
- `fix: 토큰 갱신 무한 루프 해결`
- `refactor: 검증 로직을 별도 파일로 분리`
- `docs: 새로운 에러 코드로 API.md 업데이트`

**커밋 전 확인사항**:
- console.log 구문 제거
- 하드코딩된 자격증명이 없는지 확인
- Chrome과 Safari 모두에서 테스트 (해당되는 경우)

---

## 참고 문서

### 내부 문서 (Single Source of Truth)
- **⭐ [API.md](docs/be/API.md)**: REST API 명세 (21개 엔드포인트, 28개 에러 코드) - **에러 코드 SSOT**
- **⭐ [LLD.md](docs/be/LLD.md)**: 백엔드 아키텍처 및 설계 결정사항 - **구현 패턴 SSOT**
- [DDL.md](docs/be/DDL.md): 데이터베이스 스키마 및 인덱스
- [claude-frontend-guide.md](docs/fe/claude-frontend-guide.md): 프론트엔드 개발 원칙 (가독성, 응집도, 결합도)
- [FRONTEND_GUIDE.md](docs/fe/FRONTEND_GUIDE.md): API 연동 패턴과 페이지네이션

### 외부 리소스
- Express.js: https://expressjs.com
- Spring Boot: https://spring.io/projects/spring-boot
- MySQL: https://dev.mysql.com/doc/

---

## 프로젝트 현황 및 다음 단계

**현재 상태**:
- ✅ Express.js 정적 파일 서버 구축 완료 (port 3000)
- ✅ Spring Boot API 서버 실행 중 (port 8080)
- ✅ HttpOnly Cookie 인증 전환 완료 (XSS 방지)
- ✅ localStorage 기반 userId 관리 구현 완료
- ✅ 프론트엔드 자산 안정화 완료 (`origin_source/`)

**즉시 진행할 단계**:
1. 통합 테스트 (Express.js + Spring Boot)
2. CORS 설정 최종 확인
3. 운영 환경 배포 준비

**장기 목표**:
- 선택사항: 프론트엔드를 React + TypeScript로 마이그레이션
- 선택사항: Redis 캐싱 레이어 구현 (Spring Boot)
- 선택사항: GraphQL API 레이어 추가 (Spring Boot)
