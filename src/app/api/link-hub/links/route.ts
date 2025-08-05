/**
 * 링크허브 링크 아이템 관리 API
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getLinks,
    getLinksByCategory,
    createLink,
} from "@/lib/link-hub/supabase";

// 링크 조회 (전체 또는 카테고리별)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        let links;
        if (categoryId) {
            links = await getLinksByCategory(categoryId);
        } else {
            links = await getLinks();
        }

        return NextResponse.json({
            success: true,
            data: links,
        });
    } catch (error) {
        console.error("링크 조회 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "링크 조회에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}

// 새 링크 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            category_id,
            title,
            url,
            icon_url,
            description,
            display_order,
        } = body;

        if (!category_id || !title || !url) {
            return NextResponse.json(
                {
                    success: false,
                    error: "카테고리 ID, 제목, URL은 필수입니다.",
                },
                { status: 400 }
            );
        }

        const newLink = await createLink({
            category_id,
            title,
            url,
            icon_url,
            description,
            display_order,
        });

        return NextResponse.json({
            success: true,
            data: newLink,
        });
    } catch (error) {
        console.error("링크 생성 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "링크 생성에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
