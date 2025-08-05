/**
 * 특정 링크 업데이트/삭제 API
 */

import { NextRequest, NextResponse } from "next/server";
import { updateLink, deleteLink } from "@/lib/link-hub/supabase";

interface RouteParams {
    params: {
        id: string;
    };
}

// 링크 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;
        const body = await request.json();
        const {
            title,
            url,
            icon_url,
            description,
            display_order,
            category_id,
        } = body;

        const updatedLink = await updateLink(id, {
            title,
            url,
            icon_url,
            description,
            display_order,
            category_id,
        });

        return NextResponse.json({
            success: true,
            data: updatedLink,
        });
    } catch (error) {
        console.error("링크 업데이트 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "링크 업데이트에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}

// 링크 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;

        await deleteLink(id);

        return NextResponse.json({
            success: true,
            message: "링크가 삭제되었습니다.",
        });
    } catch (error) {
        console.error("링크 삭제 오류:", error);

        return NextResponse.json(
            {
                success: false,
                error: "링크 삭제에 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
