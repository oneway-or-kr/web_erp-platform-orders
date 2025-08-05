/**
 * 링크허브 전체 데이터 조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { getLinkHubData } from "@/lib/link-hub/supabase";

export async function GET(request: NextRequest) {
    try {
        const data = await getLinkHubData();

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("링크허브 데이터 조회 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "링크허브 데이터 조회에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
