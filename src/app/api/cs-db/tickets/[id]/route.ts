import { NextRequest, NextResponse } from "next/server";
import {
    getTicketById,
    updateTicket,
    deleteTicket,
} from "@/lib/cs-db/supabase";
import {
    createAPIResponse,
    normalizeError,
    isValidStatus,
    isValidPlatform,
    isValidConvChannel,
} from "@/lib/cs-db/utils";
import type { UpdateTicketInput } from "@/lib/cs-db/types";

/**
 * 특정 CS 티켓 조회, 수정, 삭제
 * GET /api/cs-db/tickets/[id] - 티켓 상세 조회 (id는 conv_id)
 * PUT /api/cs-db/tickets/[id] - 티켓 정보 수정
 * DELETE /api/cs-db/tickets/[id] - 티켓 삭제
 */

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: convId } = await context.params;

        console.log("티켓 상세 조회 요청:", convId);

        // Supabase에서 특정 티켓 조회
        const ticket = await getTicketById(convId);

        if (!ticket) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "티켓을 찾을 수 없습니다."
                ),
                { status: 404 }
            );
        }

        return NextResponse.json(
            createAPIResponse(true, ticket, "티켓이 성공적으로 조회되었습니다.")
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("티켓 조회 중 오류:", error);

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `티켓 조회 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: convId } = await context.params;
        const body = await request.json();

        console.log("티켓 수정 요청:", convId, body);

        // 기존 티켓 존재 여부 확인
        const existingTicket = await getTicketById(convId);
        if (!existingTicket) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "수정할 티켓을 찾을 수 없습니다."
                ),
                { status: 404 }
            );
        }

        // 기본 데이터 검증
        if (body.client_name !== undefined && !body.client_name.trim()) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "고객명을 입력해주세요."
                ),
                { status: 400 }
            );
        }

        if (body.client_phone !== undefined && !body.client_phone.trim()) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "고객 전화번호를 입력해주세요."
                ),
                { status: 400 }
            );
        }

        if (body.order_number !== undefined && !body.order_number.trim()) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "주문번호를 입력해주세요."
                ),
                { status: 400 }
            );
        }

        if (body.receiver_name !== undefined && !body.receiver_name.trim()) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "수령인명을 입력해주세요."
                ),
                { status: 400 }
            );
        }

        if (body.receiver_phone !== undefined && !body.receiver_phone.trim()) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "수령인 전화번호를 입력해주세요."
                ),
                { status: 400 }
            );
        }

        // 상태 검증
        if (body.status && !isValidStatus(body.status)) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "유효하지 않은 상태입니다."
                ),
                { status: 400 }
            );
        }

        // 플랫폼 검증
        if (body.platform && !isValidPlatform(body.platform)) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "유효하지 않은 플랫폼입니다."
                ),
                { status: 400 }
            );
        }

        // CS 인입 채널 검증
        if (body.conv_channel && !isValidConvChannel(body.conv_channel)) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "유효하지 않은 CS 인입 채널입니다."
                ),
                { status: 400 }
            );
        }

        // 날짜 형식 검증 (YYYY-MM-DD)
        if (body.received_date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(body.received_date)) {
                return NextResponse.json(
                    createAPIResponse(
                        false,
                        undefined,
                        undefined,
                        "received_date는 YYYY-MM-DD 형식이어야 합니다."
                    ),
                    { status: 400 }
                );
            }
        }

        const updateData: UpdateTicketInput = {
            client_name: body.client_name?.trim(),
            client_phone: body.client_phone?.trim(),
            order_number: body.order_number?.trim(),
            received_date: body.received_date?.trim(),
            receiver_name: body.receiver_name?.trim(),
            receiver_phone: body.receiver_phone?.trim(),
            platform: body.platform?.trim(),
            tags: Array.isArray(body.tags) ? body.tags : undefined,
            return_tracknum: body.return_tracknum?.trim() || null,
            status: body.status,
            conv_channel: body.conv_channel?.trim(),
        };

        // 빈 값들 제거
        Object.keys(updateData).forEach((key) => {
            if (updateData[key as keyof UpdateTicketInput] === undefined) {
                delete updateData[key as keyof UpdateTicketInput];
            }
        });

        // Supabase에서 티켓 업데이트
        const updatedTicket = await updateTicket(convId, updateData);

        return NextResponse.json(
            createAPIResponse(
                true,
                updatedTicket,
                "티켓이 성공적으로 수정되었습니다."
            )
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("티켓 수정 중 오류:", error);

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `티켓 수정 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: convId } = await context.params;

        console.log("티켓 삭제 요청:", convId);

        // 티켓 존재 여부 확인
        const existingTicket = await getTicketById(convId);
        if (!existingTicket) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "삭제할 티켓을 찾을 수 없습니다."
                ),
                { status: 404 }
            );
        }

        // Supabase에서 티켓 삭제
        await deleteTicket(convId);

        return NextResponse.json(
            createAPIResponse(true, null, "티켓이 성공적으로 삭제되었습니다.")
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("티켓 삭제 중 오류:", error);

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `티켓 삭제 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}
