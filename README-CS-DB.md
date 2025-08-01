# CS-DB 시스템 가이드 (이커머스 주문 관련 CS 관리)

채널톡 API와 Supabase를 연동하여 이커머스 주문 관련 고객 문의(CS)를 자동으로 수집하고 관리하는 시스템입니다.

## 🌟 주요 기능

-   **자동 티켓 생성**: 채널톡 웹훅을 통해 새로운 문의가 들어오면 자동으로 CS 티켓 생성
-   **상담 태그 실시간 동기화**: 채널톡에서 상담 태그가 업데이트될 때마다 자동으로 DB 반영 (중복 방지)
-   **주문 관련 CS 관리**: 고객정보, 주문번호, 수령인정보, 플랫폼 등 이커머스 특화 정보 관리
-   **고객 프로필 자동 추출**: 채널톡 사용자 프로필에서 주문번호, 수령자 정보, 구매처 자동 추출
-   **티켓 관리**: 웹 대시보드를 통한 티켓 조회, 수정, 삭제
-   **다중 플랫폼 지원**: 네이버, 쿠팡, 11번가, ESM, 카카오, 토스 등 다양한 이커머스 플랫폼
-   **다중 채널 지원**: 채널톡, 전화, 이메일, 카카오톡, 문자 등 다양한 CS 인입 채널
-   **필터링 & 검색**: 고객명, 주문번호, 플랫폼, 상태 등 다양한 조건으로 검색
-   **실시간 통계**: 상태별, 플랫폼별, 채널별 통계 대시보드
-   **회수 관리**: 회수 송장번호 관리 기능

## 📁 파일 구조

```
src/
├── app/
│   ├── api/cs-db/
│   │   ├── webhook/route.ts           # 채널톡 웹훅 수신
│   │   └── tickets/
│   │       ├── route.ts              # 티켓 목록 조회/생성
│   │       └── [id]/route.ts         # 특정 티켓 조회/수정/삭제 (id는 conv_id)
│   └── dashboard/cs-db/
│       ├── page.tsx                  # CS 대시보드 메인 페이지
│       ├── [id]/page.tsx            # 티켓 상세/수정 페이지
│       └── components/
│           ├── TicketList.tsx        # 티켓 목록 컴포넌트
│           ├── TicketFilters.tsx     # 필터링 컴포넌트
│           ├── TicketStats.tsx       # 통계 컴포넌트
│           ├── TicketDetailView.tsx  # 티켓 상세 보기
│           └── TicketEditForm.tsx    # 티켓 편집 폼
└── lib/cs-db/
    ├── types.ts                      # 타입 정의 (새로운 스키마)
    ├── channeltalk.ts               # 채널톡 API 연동
    ├── supabase.ts                  # Supabase 연동
    └── utils.ts                     # 유틸리티 함수들
```

## 🔧 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 채널톡 설정
CHANNELTALK_WEBHOOK_SECRET=your_channeltalk_webhook_secret
CHANNELTALK_ACCESS_TOKEN=your_channeltalk_access_token
```

### 2. Supabase 테이블 생성

Supabase SQL 에디터에서 다음 쿼리를 실행하여 테이블을 생성하세요:

```sql
CREATE TABLE IF NOT EXISTS cs (
  conv_id UUID PRIMARY KEY,                    -- 대화 ID (채널톡 chat_id 또는 UUID)
  client_name TEXT NOT NULL,                   -- 고객명
  client_phone TEXT NOT NULL,                  -- 고객 전화번호
  order_number TEXT NOT NULL,                  -- 주문번호
  received_date DATE NOT NULL,                 -- CS 접수일
  receiver_name TEXT NOT NULL,                 -- 수령인명
  receiver_phone TEXT NOT NULL,                -- 수령인 전화번호
  platform TEXT NOT NULL,                     -- 플랫폼 (네이버, 쿠팡, 11번가 등)
  tags JSON,                                   -- 태그 (JSON 배열)
  return_tracknum TEXT,                        -- 회수 송장번호
  status TEXT NOT NULL CHECK (status IN ('접수', '처리중', '보류', '완료', '취소')),
  conv_channel TEXT NOT NULL,                  -- CS 인입 채널 (채널톡, 전화, 이메일 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),        -- 시스템 생성일시
  updated_at TIMESTAMPTZ DEFAULT NOW()         -- 시스템 수정일시
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cs_conv_id ON cs(conv_id);
CREATE INDEX IF NOT EXISTS idx_cs_order_number ON cs(order_number);
CREATE INDEX IF NOT EXISTS idx_cs_client_name ON cs(client_name);
CREATE INDEX IF NOT EXISTS idx_cs_status ON cs(status);
CREATE INDEX IF NOT EXISTS idx_cs_platform ON cs(platform);
CREATE INDEX IF NOT EXISTS idx_cs_received_date ON cs(received_date);
CREATE INDEX IF NOT EXISTS idx_cs_conv_channel ON cs(conv_channel);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cs_updated_at
    BEFORE UPDATE ON cs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 채널톡 웹훅 설정

1. 채널톡 관리자 페이지에서 **설정 > 개발자 > 웹훅**으로 이동
2. 새 웹훅 URL 추가: `https://your-domain.com/api/cs-db/webhook`
3. 이벤트 선택:
    - `userChat` 생성 이벤트 체크 (새로운 상담 생성)
    - `userChat` 업데이트 이벤트 체크 (상담 태그 업데이트)
4. 웹훅 시크릿 키를 환경 변수에 설정

### 4. 채널톡 API 토큰 발급

1. 채널톡 관리자 페이지에서 **설정 > 개발자 > API**로 이동
2. 액세스 토큰 생성
3. 필요한 권한: `user-chat:read`, `user-chat:write`, `user:read`
4. 토큰을 환경 변수에 설정

## 🚀 사용 방법

### 웹훅 동작 확인

1. 웹훅 엔드포인트 상태 확인:

```bash
curl https://your-domain.com/api/cs-db/webhook
```

2. 채널톡에서 테스트 메시지 전송하여 자동 티켓 생성 확인
3. 채널톡에서 상담 태그 추가/수정하여 자동 업데이트 확인

### 대시보드 사용

1. `/dashboard/cs-db`로 이동하여 CS 대시보드 접근
2. 통계 카드에서 전체 현황 확인
3. 필터를 사용하여 원하는 조건의 티켓 검색
4. 티켓 클릭하여 상세 정보 확인 및 편집

### API 직접 호출

```bash
# 티켓 목록 조회
curl "https://your-domain.com/api/cs-db/tickets?status=접수&platform=네이버"

# 특정 티켓 조회 (conv_id 사용)
curl "https://your-domain.com/api/cs-db/tickets/{conv_id}"

# 티켓 상태 업데이트
curl -X PUT "https://your-domain.com/api/cs-db/tickets/{conv_id}" \
  -H "Content-Type: application/json" \
  -d '{"status": "완료", "return_tracknum": "1234567890"}'

# 새 티켓 생성
curl -X POST "https://your-domain.com/api/cs-db/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "conv_id": "uuid-here",
    "client_name": "홍길동",
    "client_phone": "010-1234-5678",
    "order_number": "ORDER-2024-001",
    "received_date": "2024-01-15",
    "receiver_name": "김철수",
    "receiver_phone": "010-8765-4321",
    "platform": "네이버",
    "conv_channel": "채널톡",
    "status": "접수"
  }'
```

## 📊 데이터 구조

### 티켓 데이터 모델

```typescript
interface CSTicket {
    conv_id: string; // 대화 ID (Primary Key)
    client_name: string; // 고객명
    client_phone: string; // 고객 전화번호
    order_number: string; // 주문번호
    received_date: string; // CS 접수일 (YYYY-MM-DD)
    receiver_name: string; // 수령인명
    receiver_phone: string; // 수령인 전화번호
    platform: string; // 플랫폼 (네이버, 쿠팡, 11번가, ESM, 카카오, 토스, 올웨이즈, 오하우스, 카페24, 기타)
    tags: string[] | null; // 태그 배열
    return_tracknum: string | null; // 회수 송장번호
    status: TicketStatus; // CS 상태 (접수, 처리중, 보류, 완료, 취소)
    conv_channel: string; // CS 인입 채널 (채널톡, 전화, 이메일, 카카오톡, 문자, 기타)
    created_at?: string; // 시스템 생성일시
    updated_at?: string; // 시스템 수정일시
}
```

### 지원되는 플랫폼

-   **네이버**: 네이버 쇼핑
-   **쿠팡**: 쿠팡
-   **11번가**: 11번가
-   **ESM**: ESM플랫폼
-   **카카오**: 카카오 커머스
-   **토스**: 토스페이먼츠
-   **올웨이즈**: 올웨이즈
-   **오하우스**: 오하우스
-   **카페24**: 카페24
-   **기타**: 기타 플랫폼

### 지원되는 CS 인입 채널

-   **채널톡**: 채널톡 메신저
-   **전화**: 전화 상담
-   **이메일**: 이메일 문의
-   **카카오톡**: 카카오톡 플러스친구
-   **문자**: SMS/MMS
-   **기타**: 기타 채널

## 🔍 필터링 옵션

대시보드에서 사용 가능한 필터:

-   **검색어**: 고객명, 주문번호, 수령인명 통합 검색
-   **상태**: 접수, 처리중, 보류, 완료, 취소
-   **플랫폼**: 네이버, 쿠팡, 11번가, ESM, 카카오, 토스, 올웨이즈, 오하우스, 카페24, 기타
-   **CS 인입 채널**: 채널톡, 전화, 이메일, 카카오톡, 문자, 기타
-   **고객명**: 고객명 기준 필터
-   **주문번호**: 주문번호 기준 필터
-   **태그**: 쉼표로 구분된 태그 목록
-   **접수일**: 시작일과 종료일 범위 설정
-   **빠른 날짜 필터**: 오늘, 최근 7일, 30일, 90일

## 📈 통계 및 모니터링

대시보드에서 제공하는 통계:

1. **전체 현황**

    - 총 티켓 수
    - 대기 중인 티켓 수 (접수 + 처리중 + 보류)
    - 오늘/이번 주 접수된 티켓 수

2. **처리 현황**

    - 완료된 티켓 수
    - 완료율 (완료 티켓 / 전체 티켓)

3. **성과 지표**

    - 평균 처리 시간 (완료된 티켓 기준)

4. **분포 차트**
    - 상태별 티켓 분포
    - 플랫폼별 티켓 분포 (상위 5개)
    - CS 인입 채널별 티켓 분포

## 🛠️ 유지보수

### 로그 모니터링

중요한 로그는 다음 위치에서 확인:

-   웹훅 처리: `/api/cs-db/webhook` 엔드포인트
-   API 호출: `/api/cs-db/tickets/*` 엔드포인트
-   브라우저 콘솔: 클라이언트 사이드 에러

### 데이터베이스 관리

정기적으로 다음 사항을 점검:

1. **성능 최적화**

    ```sql
    -- 인덱스 사용률 확인
    SELECT * FROM pg_stat_user_indexes WHERE relname = 'cs';

    -- 테이블 크기 확인
    SELECT pg_size_pretty(pg_total_relation_size('cs'));
    ```

2. **데이터 정리**

    ```sql
    -- 6개월 이상 된 완료된 티켓 통계
    SELECT COUNT(*) FROM cs
    WHERE status = '완료'
    AND received_date < CURRENT_DATE - INTERVAL '6 months';

    -- 플랫폼별 티켓 현황
    SELECT platform, status, COUNT(*) as count
    FROM cs
    GROUP BY platform, status
    ORDER BY platform, status;
    ```

### 에러 처리

일반적인 에러 상황과 해결 방법:

1. **웹훅 시그니처 검증 실패**

    - 채널톡에서 설정한 시크릿 키 확인
    - 환경 변수 `CHANNELTALK_WEBHOOK_SECRET` 검증

2. **Supabase 연결 오류**

    - URL과 서비스 키 확인
    - RLS(Row Level Security) 정책 검토

3. **중복 티켓 생성 방지**

    - `conv_id` 유니크 제약 조건 활용
    - 웹훅에서 기존 티켓 존재 여부 확인 로직

4. **데이터 유효성 오류**
    - 플랫폼과 CS 인입 채널 값 검증
    - 날짜 형식 (YYYY-MM-DD) 검증
    - 필수 필드 누락 검사

## 💡 고급 기능

### 상담 태그 실시간 동기화

시스템은 채널톡에서 상담 태그가 업데이트될 때마다 자동으로 감지하여 DB에 반영합니다:

```typescript
// 채널톡 웹훅 처리 과정
1. 채널톡에서 상담 태그 업데이트
2. 웹훅 이벤트 수신 (event: "upsert", type: "userChat")
3. 고객 프로필에서 상담 정보 자동 추출
4. 기존 티켓 존재 시 업데이트, 없으면 새로 생성
```

### 고객 프로필 자동 추출

채널톡 사용자 프로필에서 다음 정보들을 자동으로 추출합니다:

```typescript
// 지원하는 프로필 필드명들
{
    // 주문번호
    "order_number",
        "orderNumber",
        "order_id",
        "orderId",
        "주문번호",
        // 수령자 정보
        "receiver_name",
        "receiverName",
        "recipient_name",
        "수령자",
        "수령인",
        "receiver_phone",
        "receiverPhone",
        "recipient_phone",
        "수령자전화",
        // 구매처/플랫폼
        "platform",
        "shop",
        "store",
        "marketplace",
        "구매처",
        "쇼핑몰";
}
```

### 태그 관리

```typescript
// 태그 추가
const tags = ["VIP고객", "교환요청", "급함"];

// 태그 검색 (API)
curl "https://your-domain.com/api/cs-db/tickets?tags=VIP고객,급함"
```

### 회수 관리

```typescript
// 회수 송장번호 설정
curl -X PUT "https://your-domain.com/api/cs-db/tickets/{conv_id}" \
  -H "Content-Type: application/json" \
  -d '{"return_tracknum": "1234567890", "status": "처리중"}'
```

### 대량 데이터 처리

```sql
-- 특정 기간 플랫폼별 통계
SELECT
    platform,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = '완료' THEN 1 END) as completed_tickets,
    ROUND(
        COUNT(CASE WHEN status = '완료' THEN 1 END) * 100.0 / COUNT(*),
        2
    ) as completion_rate
FROM cs
WHERE received_date >= '2024-01-01'
    AND received_date <= '2024-12-31'
GROUP BY platform
ORDER BY total_tickets DESC;
```

## 🔐 보안 고려사항

1. **웹훅 보안**

    - 시그니처 검증으로 위변조 방지
    - HTTPS 필수 사용

2. **API 보안**

    - 적절한 인증/인가 메커니즘 구현 권장
    - Rate limiting 설정 고려

3. **개인정보 보호**

    - 고객 전화번호 등 개인정보 암호화 검토
    - 정기적인 데이터 백업
    - 개인정보 처리방침 준수

4. **데이터 접근 제어**
    - 담당자별 접근 권한 관리
    - 감사 로그 기록

## 📞 문의 및 지원

시스템 관련 문의사항이나 개선 제안이 있으시면 개발팀에 연락해 주세요.

### 알려진 제한사항

-   채널톡 웹훅에서 자동 생성되는 티켓의 경우, 고객 전화번호나 주문번호가 채널톡 사용자 프로필에 없으면 기본값이 설정됩니다.
-   대화 ID는 UUID 형식이어야 하며, 채널톡의 경우 chat_id가 자동으로 사용됩니다.
-   플랫폼과 CS 인입 채널 값은 사전에 정의된 값만 사용 가능합니다.
-   상담 태그 업데이트는 채널톡에서 태그가 실제로 변경될 때만 감지됩니다.
-   고객 프로필에서 추출하는 정보는 사전에 정의된 필드명을 기준으로 합니다.

### 향후 개선 계획

-   [x] 상담 태그 실시간 동기화 기능
-   [x] 고객 프로필 자동 추출 기능
-   [ ] 고객 이력 관리 기능
-   [ ] 자동 응답 템플릿 기능
-   [ ] 엑셀 내보내기 기능
-   [ ] 실시간 알림 기능
-   [ ] 다국어 지원
-   [ ] 채널톡 API를 통한 메시지 답변 기능
