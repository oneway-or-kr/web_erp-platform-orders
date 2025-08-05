/**
 * 특정 카테고리 업데이트/삭제 API
 */

import { NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/lib/link-hub/supabase";

interface RouteParams {
    params: {
        id: string;
    };
}

// 카테고리 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, display_order } = body;

        const updatedCategory = await updateCategory(id, {
            name,
            display_order,
        });

        return NextResponse.json({
            success: true,
            data: updatedCategory,
        });
    } catch (error) {
        console.error("카테고리 업데이트 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "카테고리 업데이트에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}

// 카테고리 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;

        await deleteCategory(id);

        return NextResponse.json({
            success: true,
            message: "카테고리가 삭제되었습니다.",
        });
    } catch (error) {
        console.error("카테고리 삭제 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "카테고리 삭제에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
