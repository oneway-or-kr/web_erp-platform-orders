/**
 * 링크허브 카테고리 관리 API
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/lib/link-hub/supabase";

// 모든 카테고리 조회
export async function GET(request: NextRequest) {
    try {
        const categories = await getCategories();

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error("카테고리 조회 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "카테고리 조회에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}

// 새 카테고리 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, display_order } = body;

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error: "카테고리 이름은 필수입니다.",
                },
                { status: 400 }
            );
        }

        const newCategory = await createCategory({
            name,
            display_order,
        });

        return NextResponse.json({
            success: true,
            data: newCategory,
        });
    } catch (error) {
        console.error("카테고리 생성 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "카테고리 생성에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
