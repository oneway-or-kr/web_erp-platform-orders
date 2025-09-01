// 리뷰 문자 발송 Supabase 연동
import { createClient } from "@supabase/supabase-js";
import { OrderData } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 리뷰 SMS 데이터베이스 타입
export interface ReviewSmsRecord {
    id?: number;
    order_number: string;
    product_name: string;
    receiver_name: string;
    receiver_phone: string;
    platform: string; // POST 시에 명시적으로 설정
    sent_status: "pending" | "sent" | "failed";
    sent_at?: string;
    created_at?: string;
    updated_at?: string;
}

export class ReviewSmsSupabase {
    /**
     * 리뷰 SMS 데이터를 데이터베이스에 저장
     * @param orderData 주문 데이터 배열
     * @returns 저장 결과
     */
    static async saveReviewSmsData(
        orderData: OrderData[]
    ): Promise<{ success: boolean; count?: number; error?: string }> {
        try {
            // OrderData를 ReviewSmsRecord 형태로 변환
            const reviewSmsRecords: Omit<
                ReviewSmsRecord,
                "id" | "created_at" | "updated_at"
            >[] = orderData.map((order) => ({
                order_number: order.order_number,
                product_name: order.product_name,
                receiver_name: order.receiver_name,
                receiver_phone: order.receiver_phone,
                platform: "쿠팡", // 항상 쿠팡으로 설정
                sent_status: "pending", // 초기 상태는 대기
            }));

            console.log(
                `💾 ${reviewSmsRecords.length}건의 리뷰 SMS 데이터를 저장합니다...`
            );

            const { data, error } = await supabase
                .from("review_sms")
                .insert(reviewSmsRecords)
                .select();

            if (error) {
                throw error;
            }

            console.log(`✅ 리뷰 SMS 데이터 저장 완료: ${data?.length}건`);

            return {
                success: true,
                count: data?.length || 0,
            };
        } catch (error) {
            console.error("❌ 리뷰 SMS 데이터 저장 실패:", error);
            return {
                success: false,
                error: `데이터 저장 실패: ${error}`,
            };
        }
    }

    /**
     * 문자 발송 상태 업데이트
     * @param orderNumbers 주문번호 배열
     * @param status 발송 상태
     * @returns 업데이트 결과
     */
    static async updateSentStatus(
        orderNumbers: string[],
        status: "sent" | "failed"
    ): Promise<{ success: boolean; count?: number; error?: string }> {
        try {
            const updateData = {
                sent_status: status,
                sent_at: status === "sent" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from("review_sms")
                .update(updateData)
                .in("order_number", orderNumbers)
                .eq("sent_status", "pending")
                .select();

            if (error) {
                throw error;
            }

            console.log(
                `📱 문자 발송 상태 업데이트 완료: ${data?.length}건 → ${status}`
            );

            return {
                success: true,
                count: data?.length || 0,
            };
        } catch (error) {
            console.error("❌ 문자 발송 상태 업데이트 실패:", error);
            return {
                success: false,
                error: `상태 업데이트 실패: ${error}`,
            };
        }
    }

    /**
     * 리뷰 SMS 발송 기록 조회
     * @param limit 조회 개수 제한
     * @returns 발송 기록
     */
    static async getReviewSmsRecords(
        limit: number = 100
    ): Promise<{ success: boolean; data?: ReviewSmsRecord[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from("review_sms")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            console.error("❌ 리뷰 SMS 기록 조회 실패:", error);
            return {
                success: false,
                error: `기록 조회 실패: ${error}`,
            };
        }
    }
}

/**
 * 리뷰 SMS 테이블 스키마 (Supabase에서 실행)
 */
export const REVIEW_SMS_TABLE_SCHEMA = `
-- 리뷰 SMS 발송 기록 테이블
CREATE TABLE IF NOT EXISTS review_sms (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '쿠팡',
  sent_status TEXT NOT NULL CHECK (sent_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_review_sms_order_number ON review_sms(order_number);
CREATE INDEX IF NOT EXISTS idx_review_sms_platform ON review_sms(platform);
CREATE INDEX IF NOT EXISTS idx_review_sms_sent_status ON review_sms(sent_status);
CREATE INDEX IF NOT EXISTS idx_review_sms_created_at ON review_sms(created_at);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_sms_updated_at 
    BEFORE UPDATE ON review_sms
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;
