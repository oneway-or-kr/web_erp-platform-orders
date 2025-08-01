import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
    verifyChannelTalkWebhook,
    processChannelTalkWebhook,
} from "@/lib/cs-db/channeltalk";
import {
    createTicket,
    getTicketById,
    upsertTicket,
} from "@/lib/cs-db/supabase";
import { createAPIResponse, normalizeError } from "@/lib/cs-db/utils";

/**
 * 채널톡 웹훅을 수신하는 엔드포인트
 * POST /api/cs-db/webhook
 */
export async function POST(request: NextRequest) {
    try {
        // 요청 본문 읽기
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);

        // 웹훅 시그니처 검증
        const headersList = await headers();
        const signature = headersList.get("x-signature");

        if (!signature) {
            console.warn("웹훅 시그니처가 없는 요청");
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "웹훅 시그니처가 없습니다."
                ),
                { status: 401 }
            );
        }

        // 시그니처 검증
        const isValidSignature = verifyChannelTalkWebhook(bodyText, signature);
        if (!isValidSignature) {
            console.warn("유효하지 않은 웹훅 시그니처");
            return NextResponse.json(
                createAPIResponse(
                    false,
                    undefined,
                    undefined,
                    "유효하지 않은 웹훅 시그니처입니다."
                ),
                { status: 401 }
            );
        }

        console.log("채널톡 웹훅 수신:", {
            type: body.type,
            entity: body.entity,
            chatId: body.refers?.chat?.id,
        });

        // 웹훅 데이터 처리
        const processingResult = processChannelTalkWebhook(body);

        // 새로운 상담 생성 또는 기존 상담 업데이트 처리
        if (processingResult.ticketData) {
            if (processingResult.shouldCreateTicket) {
                // 새로운 상담 생성 - 중복 확인 후 생성
                const existingTicket = await getTicketById(
                    processingResult.ticketData.conv_id
                );

                if (existingTicket) {
                    console.log(
                        "이미 존재하는 대화 ID:",
                        processingResult.ticketData.conv_id
                    );
                    return NextResponse.json(
                        createAPIResponse(
                            true,
                            { convId: existingTicket.conv_id },
                            "이미 처리된 채팅입니다."
                        )
                    );
                }

                // 새 티켓 생성
                const newTicket = await createTicket(
                    processingResult.ticketData
                );

                console.log("새 CS 티켓 생성됨:", {
                    convId: newTicket.conv_id,
                    clientName: newTicket.client_name,
                    platform: newTicket.platform,
                    convChannel: newTicket.conv_channel,
                    tags: newTicket.tags,
                });

                return NextResponse.json(
                    createAPIResponse(
                        true,
                        { convId: newTicket.conv_id },
                        "새 CS 티켓이 생성되었습니다."
                    )
                );
            } else if (processingResult.shouldUpdateTicket) {
                // 상담 태그 업데이트 - 기존 티켓 업데이트 또는 새로 생성
                const ticket = await upsertTicket(processingResult.ticketData);

                console.log("CS 티켓 업데이트됨:", {
                    convId: ticket.conv_id,
                    clientName: ticket.client_name,
                    platform: ticket.platform,
                    tags: ticket.tags,
                    action: "상담 태그 업데이트",
                });

                return NextResponse.json(
                    createAPIResponse(
                        true,
                        { convId: ticket.conv_id },
                        "CS 티켓이 업데이트되었습니다."
                    )
                );
            }
        }

        // 티켓 생성이 필요하지 않은 웹훅
        return NextResponse.json(
            createAPIResponse(true, null, "웹훅이 성공적으로 처리되었습니다.")
        );
    } catch (error) {
        const errorMessage = normalizeError(error);
        console.error("웹훅 처리 중 오류:", error);

        return NextResponse.json(
            createAPIResponse(
                false,
                undefined,
                undefined,
                `웹훅 처리 중 오류: ${errorMessage}`
            ),
            { status: 500 }
        );
    }
}

// 채널톡 웹훅 설정 확인용 GET 엔드포인트
export async function GET() {
    return NextResponse.json({
        message: "채널톡 웹훅 엔드포인트가 정상 작동 중입니다.",
        timestamp: new Date().toISOString(),
    });
}
