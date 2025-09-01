-- review_sms 테이블 생성 및 설정
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS review_sms (
    id BIGSERIAL PRIMARY KEY,
    order_number TEXT NOT NULL,
    product_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    platform TEXT NOT NULL,
    sent_status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_review_sms_order_number ON review_sms(order_number);
CREATE INDEX IF NOT EXISTS idx_review_sms_sent_status ON review_sms(sent_status);
CREATE INDEX IF NOT EXISTS idx_review_sms_created_at ON review_sms(created_at);

-- 3. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. updated_at 트리거
DROP TRIGGER IF EXISTS update_review_sms_updated_at ON review_sms;
CREATE TRIGGER update_review_sms_updated_at
    BEFORE UPDATE ON review_sms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS 비활성화 (개발용 - 운영시에는 적절한 정책 설정 필요)
ALTER TABLE review_sms DISABLE ROW LEVEL SECURITY;

-- 6. 테이블 권한 설정 (anon, authenticated 사용자에게 모든 권한)
GRANT ALL ON review_sms TO anon;
GRANT ALL ON review_sms TO authenticated;
GRANT ALL ON review_sms TO service_role;

-- 7. 시퀀스 권한 설정
GRANT USAGE, SELECT ON SEQUENCE review_sms_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE review_sms_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE review_sms_id_seq TO service_role;

-- 확인용 쿼리
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'review_sms';

-- 테이블 구조 확인
\d review_sms;
