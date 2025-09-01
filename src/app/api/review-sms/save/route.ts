// 리뷰 SMS 데이터 저장 API
import { NextRequest, NextResponse } from "next/server";
import { ReviewSmsSupabase } from "@/lib/review-sms/supabase";
import { OrderData } from "@/lib/review-sms/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("📥 리뷰 SMS 데이터 저장 요청:", {
            dataCount: body.orderData?.length || 0,
        });

        // 요청 데이터 검증
        if (!body.orderData || !Array.isArray(body.orderData)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "유효하지 않은 주문 데이터입니다.",
                },
                { status: 400 }
            );
        }

        const orderData: OrderData[] = body.orderData;

        if (orderData.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "저장할 데이터가 없습니다.",
                },
                { status: 400 }
            );
        }

        // Supabase에 데이터 저장
        const result = await ReviewSmsSupabase.saveReviewSmsData(orderData);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: 500 }
            );
        }

        console.log(`✅ 리뷰 SMS 데이터 저장 성공: ${result.count}건`);

        return NextResponse.json({
            success: true,
            message: `${result.count}건의 리뷰 SMS 데이터가 저장되었습니다.`,
            count: result.count,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("❌ 리뷰 SMS 데이터 저장 API 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: `서버 오류: ${error}`,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

