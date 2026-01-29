# OAuth 로그인 구현 완료 (백엔드 처리 방식)

## 인증 아키텍처

백엔드가 **Spring Security OAuth2 + JWT + Redis**를 사용하여 인증을 처리합니다.

### 보안 특징

- **Exchange Code 패턴**: OAuth 리다이렉트에서 토큰 직접 노출 방지 (30초 TTL)
- **HttpOnly Cookie**: XSS 공격으로부터 Refresh Token 보호
- **Refresh Token Rotation**: 토큰 재사용 공격 탐지 및 차단
- **Redis TTL**: 자동 토큰 만료 관리

## 전체 인증 플로우

### 1. OAuth 로그인 시작

```
프론트엔드 (/login)
  ↓ "카카오로 시작하기" 클릭
백엔드 (http://localhost:8080/oauth2/authorization/kakao)
  ↓ 자동 리다이렉트
Kakao OAuth 페이지
  ↓ 사용자 인증
백엔드 (http://localhost:8080/login/oauth2/code/kakao?code=XXX)
  ↓ OAuth2LoginSuccessHandler 처리
프론트엔드 (http://localhost:3000/auth/success?code=exchangeCode)
```

**Exchange Code**: 일회성 교환 코드 (30초 TTL, Redis 저장)

### 2. 토큰 발급

```
프론트엔드 → POST /api/v1/auth/token
Body: { "code": "exchangeCode" }

응답:
{
  "code": "SUCCESS",
  "message": "토큰 발급에 성공하였습니다.",
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 1800,
    "is_new_user": false
  }
}

+ Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax
```

**Access Token**: JSON 응답 (30분 유효)
**Refresh Token**: HttpOnly Cookie (14일 유효)

### 3. API 요청

```
프론트엔드 → API 요청
Header: Authorization: Bearer {accessToken}
Cookie: refresh_token=... (자동 전송)

→ JwtAuthenticationFilter (토큰 검증)
→ SecurityContext에 인증 정보 저장
→ Controller
```

### 4. 토큰 갱신 (Refresh Token Rotation)

```
프론트엔드 → POST /api/v1/auth/refresh
Cookie: refresh_token={refreshToken} (자동 전송)

응답:
- 새 Access Token (JSON)
- 새 Refresh Token (Cookie, 기존 토큰 무효화)
```

**Rotation 방식**: 매번 새 Refresh Token 발급, 기존 토큰 삭제
**재사용 탐지**: 이미 사용된 토큰 재사용 시 모든 토큰 삭제

### 5. 로그아웃

```
프론트엔드 → POST /api/v1/auth/logout
→ Redis에서 Refresh Token 삭제
→ 쿠키 만료 처리
→ localStorage에서 Access Token 삭제
```

## 구현된 파일

### 생성된 파일

- `src/types/auth.ts` - TypeScript 타입 정의
- `src/lib/auth/tokenStorage.ts` - Access Token 저장/조회/삭제
- `src/lib/api/client.ts` - API 클라이언트 (credentials: 'include')
- `src/lib/api/auth.ts` - 인증 API 호출
- `src/contexts/AuthContext.tsx` - 전역 인증 상태 관리
- `src/app/auth/success/page.tsx` - OAuth 성공 후 콜백 처리
- `src/components/auth/ProtectedRoute.tsx` - 인증 필요 컴포넌트

### 수정된 파일

- `src/app/layout.tsx` - AuthProvider 추가
- `src/app/(main)/layout.tsx` - ProtectedRoute 적용
- `src/app/(auth)/login/page.tsx` - 백엔드 OAuth URL로 리다이렉트
- `src/app/(auth)/nickname/page.tsx` - 닉네임 저장 API 호출
- `src/app/(auth)/lifestyle-tags/page.tsx` - 태그 저장 API 호출

## 프론트엔드 토큰 관리

### Access Token

- **저장**: localStorage (tokenStorage)
- **사용**: 모든 API 요청 헤더에 포함
  ```typescript
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
  ```
- **유효기간**: 30분
- **갱신**: Refresh Token으로 재발급

### Refresh Token

- **저장**: HttpOnly Cookie (백엔드 자동 설정)
- **사용**: 브라우저가 자동으로 쿠키 전송
- **유효기간**: 14일
- **보안**: JavaScript 접근 불가 (XSS 방어)

### credentials: 'include'

모든 API 요청에 쿠키를 자동으로 포함하도록 설정:

```typescript
fetch(url, {
  credentials: 'include',
  headers: { ... }
})
```

## 사용자 플로우

### 신규 사용자

1. `/login` → "카카오로 시작하기" 클릭
2. 백엔드 OAuth URL로 리다이렉트
3. Kakao 인증 후 백엔드 처리
4. `/auth/success?code=exchangeCode` 리다이렉트
5. 프론트엔드가 code로 토큰 발급
6. `is_new_user: true` 확인
7. `/nickname` → 닉네임 입력
8. `/lifestyle-tags` → 태그 선택
9. `/home` → 메인 페이지

### 기존 사용자

1. `/login` → "카카오로 시작하기" 클릭
2. 백엔드 OAuth URL로 리다이렉트
3. Kakao 인증 후 백엔드 처리
4. `/auth/success?code=exchangeCode` 리다이렉트
5. 프론트엔드가 code로 토큰 발급
6. `is_new_user: false` 확인
7. `/home` → 바로 메인 페이지

## API 엔드포인트

### 인증 제외 경로

- `/oauth2/**`, `/login/**`
- `/api/v1/auth/token`, `/api/v1/auth/refresh`

### 1. 토큰 발급

```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "code": "exchangeCode"
}

→ 200 OK
{
  "code": "SUCCESS",
  "message": "토큰 발급에 성공하였습니다.",
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 1800,
    "is_new_user": false
  }
}
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax
```

### 2. 토큰 갱신

```http
POST /api/v1/auth/refresh
Cookie: refresh_token=...

→ 200 OK
{
  "code": "SUCCESS",
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 1800
  }
}
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax (새 토큰)
```

### 3. 로그아웃

```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
Cookie: refresh_token=...

→ 200 OK
Set-Cookie: refresh_token=; Max-Age=0 (쿠키 삭제)
```

### 4. 닉네임 저장

```http
PATCH /api/v1/members/nickname
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nickname": "사용자닉네임"
}
```

### 5. 라이프스타일 태그 저장

```http
POST /api/v1/lifestyles
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tags": ["신혼부부", "반려동물", "재택근무"]
}
```

## 테스트 방법

### 1. 개발 서버 실행

```bash
npm run dev
```

### 2. 백엔드 서버 실행

백엔드 API 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.

### 3. 테스트 시나리오

#### OAuth 로그인 플로우

1. `http://localhost:3000/login` 접속
2. "카카오로 시작하기" 클릭
3. `http://localhost:8080/oauth2/authorization/kakao`로 리다이렉트 확인
4. Kakao OAuth 페이지로 이동 확인
5. 인증 후 `/auth/success?code=XXX`로 리다이렉트 확인
6. Network 탭에서 `POST /api/v1/auth/token` 호출 확인
7. 응답에서 `access_token` 확인
8. Application → Cookies에서 `refresh_token` 확인

#### 신규 사용자 Onboarding

1. OAuth 로그인 완료 후 `/nickname` 페이지로 이동 확인
2. 닉네임 입력 후 "다음" 클릭
3. Network 탭에서 `PATCH /v1/members/nickname` 호출 확인
4. Request Headers에 `Authorization: Bearer ...` 확인
5. `/lifestyle-tags` 페이지로 이동 확인
6. 태그 선택 후 "완료" 클릭
7. Network 탭에서 `POST /v1/lifestyles` 호출 확인
8. `/home` 페이지로 이동 확인

#### 기존 사용자 로그인

1. OAuth 로그인 완료 후 바로 `/home`으로 이동 확인

#### 토큰 확인

1. **Access Token**: Application → Local Storage → `auth_token`
2. **Refresh Token**: Application → Cookies → `refresh_token`
   - HttpOnly: ✓ (JavaScript로 접근 불가)
   - Secure: ✓ (HTTPS만)
   - SameSite: Lax

#### 페이지 새로고침

1. 로그인 후 페이지 새로고침
2. 로그인 상태 유지 확인
3. localStorage에서 토큰 읽어서 복원

## 환경 변수

### .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**주의**: Kakao OAuth 설정은 **백엔드**에서 관리합니다. 프론트엔드에서는 불필요합니다.

## 파일 구조

```
src/
├── types/
│   └── auth.ts
├── lib/
│   ├── auth/
│   │   └── tokenStorage.ts
│   └── api/
│       ├── client.ts
│       └── auth.ts
├── contexts/
│   └── AuthContext.tsx
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx
│       └── index.ts
└── app/
    ├── layout.tsx (AuthProvider)
    ├── auth/
    │   └── success/
    │       └── page.tsx (OAuth 콜백)
    ├── (auth)/
    │   ├── login/
    │   │   └── page.tsx (백엔드 OAuth URL로 리다이렉트)
    │   ├── nickname/
    │   │   └── page.tsx (API 연동)
    │   └── lifestyle-tags/
    │       └── page.tsx (API 연동)
    └── (main)/
        └── layout.tsx (ProtectedRoute)
```

## 보안 고려사항

### 현재 적용된 보안

✅ Exchange Code 패턴 (일회성 코드, 30초 TTL)
✅ HttpOnly Cookie (XSS 방어)
✅ Refresh Token Rotation (재사용 공격 방어)
✅ credentials: 'include' (쿠키 자동 전송)
✅ JWT 토큰 검증 (백엔드)

### 추가 개선 사항 (선택)

- HTTPS 적용 (프로덕션 필수)
- CORS 설정 확인
- Access Token도 메모리에 저장 (localStorage 대신)
- 토큰 만료 시 자동 리프레시 로직

## 다음 단계

1. **토큰 자동 갱신**: Access Token 만료 시 자동으로 Refresh Token으로 갱신
2. **로그아웃 기능**: 마이페이지에서 로그아웃 버튼 추가
3. **에러 처리 개선**: 토큰 만료, 네트워크 오류 등 사용자 친화적 메시지
4. **로딩 상태 개선**: 스켈레톤 UI 추가
