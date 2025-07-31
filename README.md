# 웹 ERP 시스템

Next.js 기반의 웹 ERP 시스템입니다. 플랫폼별 주문 데이터를 통합 관리할 수 있습니다.

## 주요 기능

-   **플랫폼별 주문 업로드**: 네이버, 쿠팡, G마켓 등 다양한 플랫폼의 엑셀 파일을 업로드하여 통합 CSV로 변환
-   **간단한 인증 시스템**: 아이디/비밀번호 기반 로그인
-   **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env.local
```

`.env.local` 파일에서 다음 값들을 수정하세요:

```env
LOGIN_ID=your_admin_id
LOGIN_PASSWORD=your_secure_password
SESSION_SECRET=your-long-random-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하세요.

## 프로젝트 구조

```
src/
├── app/
│   ├── login/              # 로그인 페이지
│   ├── dashboard/          # 메인 대시보드
│   │   ├── platform-orders/ # 플랫폼별 주문 업로드
│   │   └── layout.tsx      # 대시보드 레이아웃
│   ├── api/
│   │   └── auth/           # 인증 API
│   └── page.tsx           # 루트 페이지 (리디렉션)
└── components/
    ├── Navbar.tsx         # 상단 네비게이션
    └── Sidebar.tsx        # 왼쪽 사이드바
```

## 사용 방법

1. **로그인**: 설정한 아이디/비밀번호로 로그인
2. **파일 업로드**: 각 플랫폼별로 엑셀 파일 업로드
3. **데이터 처리**: "통합 CSV 생성" 버튼으로 데이터 변환
4. **결과 다운로드**: 처리된 통합 CSV 파일 다운로드

## 지원하는 플랫폼

-   네이버 스마트스토어
-   쿠팡
-   G마켓
-   옥션
-   11번가
-   티몬
-   위메프

## 기술 스택

-   **Frontend**: Next.js 15, React, TypeScript
-   **Styling**: Tailwind CSS
-   **파일 처리**: xlsx, papaparse
-   **인증**: 커스텀 구현 (쿠키 기반)

## 보안 주의사항

-   **운영 환경에서는 반드시 강력한 비밀번호와 시크릿 키를 사용하세요**
-   `.env.local` 파일은 Git에 커밋하지 마세요
-   HTTPS를 사용하는 것을 권장합니다

## 개발 중인 기능

-   재고 관리
-   매출 분석
-   사용자 권한 관리
-   데이터 백업/복원

## 라이선스

Private Project
