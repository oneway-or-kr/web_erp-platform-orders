import { NextRequest, NextResponse } from "next/server";
import { getTickets, createTicket } from "@/lib/cs-db/supabase";
import {
    createAPIResponse,
    normalizeError,
    isValidStatus,
    isValidPlatform,
    isValidConvChannel,
} from "@/lib/cs-db/utils";
import type { TicketFilters, CreateTicketInput } from "@/lib/cs-db/types";

/**
 * CS 티켓 목록 조회 및 생성
 * GET /api/cs-db/tickets - 티켓 목록 조회
 * POST /api/cs-db/tickets - 새 티켓 생성
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // 페이징 파라미터
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "20"))
        );

        // 정렬 파라미터
        const sortBy = searchParams.get("sortBy") || "received_date";
        const sortOrder = (
            searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
        ) as "asc" | "desc";

        // 필터 파라미터
        const filters: TicketFilters = {};

        const status = searchParams.get("status");
        if (status && isValidStatus(status)) {
            filters.status = status;
        }

        const platform = searchParams.get("platform");
        if (platform && isValidPlatform(platform)) {
            filters.platform = platform;
        }

        const convChannel = searchParams.get("conv_channel");
        if (convChannel && isValidConvChannel(convChannel)) {
            filters.conv_channel = convChannel;
        }

        const clientName = searchParams.get("client_name");
        if (clientName) {
            filters.client_name = clientName;
        }

        const orderNumber = searchParams.get("order_number");
        if (orderNumber) {
            filters.order_number = orderNumber;
        }

        const search = searchParams.get("search");
        if (search) {
            filters.search = search;
        }

        const receivedAfter = searchParams.get("received_after");
        if (receivedAfter) {
            filters.received_after = receivedAfter;
        }

        const receivedBefore = searchParams.get("received_before");
        if (receivedBefore) {
            filters.received_before = receivedBefore;
        }

        const tagsParam = searchParams.get("tags");
        if (tagsParam) {
            filters.tags = tagsParam
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
        }

        console.log("티켓 목록 조회 요청:", {
            page,
            limit,
            filters,
            sortBy,
            sortOrder,
        });

        // Supabase에서 티켓 목록 조회
        const result = await getTickets(
            filters,
            page,
            limit,
            sortBy,
            sortOrder
        );

        return NextResponse.json(
            createAPIResponse(
                true,
                result,
                `총 ${result.pagination.total}개의 티켓을 조회했습니다.`
            )
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("티켓 목록 조회 중 오류:", error);

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `티켓 목록 조회 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("새 티켓 생성 요청:", body);

        // 필수 필드 검증
        const requiredFields = [
            "conv_id",
            "client_name",
            "client_phone",
            "order_number",
            "received_date",
            "receiver_name",
            "receiver_phone",
            "platform",
            "conv_channel",
        ];

        const missingFields = requiredFields.filter(
            (field) =>
                !body[field] ||
                typeof body[field] !== "string" ||
                body[field].trim() === ""
        );

        if (missingFields.length > 0) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    `다음 필수 필드가 누락되었거나 유효하지 않습니다: ${missingFields.join(
                        ", "
                    )}`
                ),
                { status: 400 }
            );
        }

        // 데이터 유효성 검증
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

        // 티켓 생성 데이터 준비
        const ticketInput: CreateTicketInput = {
            conv_id: body.conv_id.trim(),
            client_name: body.client_name.trim(),
            client_phone: body.client_phone.trim(),
            order_number: body.order_number.trim(),
            received_date: body.received_date.trim(),
            receiver_name: body.receiver_name.trim(),
            receiver_phone: body.receiver_phone.trim(),
            platform: body.platform.trim(),
            conv_channel: body.conv_channel.trim(),
            tags: Array.isArray(body.tags) ? body.tags : [],
            return_tracknum: body.return_tracknum?.trim() || null,
            status: body.status || "접수",
        };

        // 새 티켓 생성
        const newTicket = await createTicket(ticketInput);

        console.log("새 CS 티켓 생성 완료:", {
            convId: newTicket.conv_id,
            clientName: newTicket.client_name,
            orderNumber: newTicket.order_number,
            platform: newTicket.platform,
        });

        return NextResponse.json(
            createAPIResponse(
                true,
                newTicket,
                "새 CS 티켓이 성공적으로 생성되었습니다."
            ),
            { status: 201 }
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("티켓 생성 중 오류:", error);

        // 중복 키 오류 처리
        if (
            errorMessage.includes("duplicate key") ||
            errorMessage.includes("already exists")
        ) {
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "이미 동일한 대화 ID의 티켓이 존재합니다."
                ),
                { status: 409 }
            );
        }

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `티켓 생성 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}
