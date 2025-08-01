/**
 * 채널톡 API 연동 관련 유틸리티 함수들
 */

import crypto from "crypto";
import {
    ChannelTalkWebhookPayload,
    ChannelTalkMessage,
    ChannelTalkUserProfile,
    CreateTicketInput,
} from "./types";

// 환경 변수에서 채널톡 설정 읽기
const CHANNELTALK_SECRET = process.env.CHANNELTALK_WEBHOOK_SECRET;
const CHANNELTALK_ACCESS_TOKEN = process.env.CHANNELTALK_ACCESS_TOKEN;
const CHANNELTALK_API_BASE_URL = "https://api.channel.io/open/v5";

/**
 * 채널톡 웹훅 시그니처 검증
 */
export function verifyChannelTalkWebhook(
    payload: string,
    signature: string
): boolean {
    if (!CHANNELTALK_SECRET) {
        console.error("CHANNELTALK_WEBHOOK_SECRET이 설정되지 않았습니다.");
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac("sha256", CHANNELTALK_SECRET)
            .update(payload, "utf8")
            .digest("hex");

        // 시그니처 비교 (상수 시간 비교)
        return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
        );
    } catch (error) {
        console.error("웹훅 시그니처 검증 중 오류:", error);
        return false;
    }
}

/**
 * 고객 프로필에서 상담 관련 정보 추출
 */
function extractCsInfoFromProfile(userProfile: ChannelTalkUserProfile): {
    orderNumber: string;
    receiverName: string;
    receiverPhone: string;
    platform: string;
} {
    // 프로필에서 주문번호 추출 시도 (다양한 필드명 시도)
    const orderNumber =
        userProfile.order_number ||
        userProfile.orderNumber ||
        userProfile.order_id ||
        userProfile.orderId ||
        userProfile["주문번호"] ||
        `CT_${Date.now().toString().slice(-8)}`;

    // 수령자 이름 추출 시도
    const receiverName =
        userProfile.receiver_name ||
        userProfile.receiverName ||
        userProfile.recipient_name ||
        userProfile.recipientName ||
        userProfile["수령자"] ||
        userProfile["수령인"] ||
        userProfile.name ||
        "정보없음";

    // 수령자 전화번호 추출 시도
    const receiverPhone =
        userProfile.receiver_phone ||
        userProfile.receiverPhone ||
        userProfile.recipient_phone ||
        userProfile.recipientPhone ||
        userProfile["수령자전화"] ||
        userProfile["수령인전화"] ||
        userProfile.phone ||
        userProfile.mobile ||
        userProfile.phoneNumber ||
        "정보없음";

    // 구매처/플랫폼 추출 시도
    const platform =
        userProfile.platform ||
        userProfile.shop ||
        userProfile.store ||
        userProfile.marketplace ||
        userProfile["구매처"] ||
        userProfile["쇼핑몰"] ||
        "기타";

    return {
        orderNumber,
        receiverName,
        receiverPhone,
        platform,
    };
}

/**
 * 채널톡 웹훅 페이로드 처리 (새로운 CS 스키마 기반)
 * - 새로운 userChat 생성 시 티켓 생성
 * - userChat 태그 업데이트 시 티켓 업데이트/생성
 */
export function processChannelTalkWebhook(payload: ChannelTalkWebhookPayload): {
    shouldCreateTicket: boolean;
    shouldUpdateTicket: boolean;
    ticketData?: CreateTicketInput;
    convId?: string;
} {
    console.log("채널톡 웹훅 처리:", payload);

    // userChat 관련 이벤트 처리 (생성 또는 업데이트)
    if (payload.type === "userChat") {
        let userChatData: unknown;
        let userData: unknown;

        // 이벤트 타입에 따라 데이터 추출
        if (payload.event === "push" && payload.entity) {
            // 새로운 userChat 생성 이벤트
            userChatData = payload.entity;
            userData = payload.refers?.user;
        } else if (
            (payload.event === "upsert" || payload.event === "update") &&
            payload.entity
        ) {
            // userChat 업데이트 이벤트 (태그 업데이트 포함)
            userChatData = payload.entity;
            userData = payload.refers?.user;
        }

        if (userChatData && userData) {
            // 타입 안전성을 위해 타입 단언 사용
            const userDataTyped = userData as {
                name?: string;
                profile?: ChannelTalkUserProfile;
            };
            const userChatDataTyped = userChatData as {
                id: string;
                tags?: string[];
            };

            // 사용자 정보에서 기본 정보 추출
            const userProfile = userDataTyped.profile || {};
            const clientPhone =
                userProfile.phone ||
                userProfile.mobile ||
                userProfile.phoneNumber ||
                userProfile.mobileNumber ||
                "정보없음";

            const clientName =
                userDataTyped.name ||
                userProfile.name ||
                `고객_${userChatDataTyped.id.substring(0, 8)}`;

            // 프로필에서 상담 관련 정보 추출
            const csInfo = extractCsInfoFromProfile(userProfile);

            // 현재 날짜를 YYYY-MM-DD 형식으로 포맷
            const receivedDate = new Date().toISOString().split("T")[0];

            const ticketData = {
                conv_id: userChatDataTyped.id, // 채널톡 채팅 ID를 대화 ID로 사용
                client_name: clientName,
                client_phone: clientPhone,
                order_number: csInfo.orderNumber,
                received_date: receivedDate,
                receiver_name: csInfo.receiverName,
                receiver_phone: csInfo.receiverPhone,
                platform: csInfo.platform,
                tags: userChatDataTyped.tags || [],
                return_tracknum: null, // 채널톡에서는 회수 송장 번호가 없음
                status: "접수" as const, // 기본 상태
                conv_channel: "채널톡", // CS 인입 채널
            };

            // 새로운 상담 생성인 경우
            if (payload.event === "push") {
                return {
                    shouldCreateTicket: true,
                    shouldUpdateTicket: false,
                    ticketData,
                };
            }

            // 태그 업데이트인 경우 (기존 티켓이 있으면 업데이트, 없으면 생성)
            if (payload.event === "upsert" || payload.event === "update") {
                return {
                    shouldCreateTicket: false,
                    shouldUpdateTicket: true,
                    ticketData,
                    convId: userChatDataTyped.id,
                };
            }
        }
    }

    // 이전 버전 호환성을 위한 처리
    if (
        payload.type === "create" &&
        payload.entity === "userChat" &&
        payload.refers?.chat
    ) {
        const chat = payload.refers.chat;
        const user = payload.refers.user;

        if (user) {
            // 타입 안전성을 위해 타입 단언 사용
            const userTyped = user as {
                name?: string;
                profile?: ChannelTalkUserProfile;
            };
            const chatTyped = chat as {
                id: string;
                tags?: string[];
            };

            const userProfile = userTyped.profile || {};
            const clientPhone =
                userProfile.phone ||
                userProfile.mobile ||
                userProfile.phoneNumber ||
                "정보없음";
            const clientName =
                userTyped.name ||
                userProfile.name ||
                `고객_${chatTyped.id.substring(0, 8)}`;

            const csInfo = extractCsInfoFromProfile(userProfile);
            const receivedDate = new Date().toISOString().split("T")[0];

            return {
                shouldCreateTicket: true,
                shouldUpdateTicket: false,
                ticketData: {
                    conv_id: chatTyped.id,
                    client_name: clientName,
                    client_phone: clientPhone,
                    order_number: csInfo.orderNumber,
                    received_date: receivedDate,
                    receiver_name: csInfo.receiverName,
                    receiver_phone: csInfo.receiverPhone,
                    platform: csInfo.platform,
                    tags: chatTyped.tags || [],
                    return_tracknum: null,
                    status: "접수" as const,
                    conv_channel: "채널톡",
                },
            };
        }
    }

    return {
        shouldCreateTicket: false,
        shouldUpdateTicket: false,
    };
}

/**
 * 채널톡 API 호출을 위한 기본 헤더
 */
function getChannelTalkHeaders(): Record<string, string> {
    if (!CHANNELTALK_ACCESS_TOKEN) {
        throw new Error("CHANNELTALK_ACCESS_TOKEN이 설정되지 않았습니다.");
    }

    return {
        Authorization: `Bearer ${CHANNELTALK_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    };
}

/**
 * 채널톡 채팅 메시지 조회
 */
export async function getChannelTalkMessages(
    chatId: string,
    limit: number = 20,
    since?: string
): Promise<ChannelTalkMessage[]> {
    try {
        const url = new URL(
            `${CHANNELTALK_API_BASE_URL}/user-chats/${chatId}/messages`
        );
        url.searchParams.append("limit", limit.toString());
        if (since) {
            url.searchParams.append("since", since);
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: getChannelTalkHeaders(),
        });

        if (!response.ok) {
            throw new Error(
                `채널톡 API 오류: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        return data.messages || [];
    } catch (error) {
        console.error("채널톡 메시지 조회 중 오류:", error);
        throw error;
    }
}

/**
 * 채널톡 채팅에 메시지 전송
 */
export async function sendChannelTalkMessage(
    chatId: string,
    message: string,
    personId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${CHANNELTALK_API_BASE_URL}/user-chats/${chatId}/messages`,
            {
                method: "POST",
                headers: getChannelTalkHeaders(),
                body: JSON.stringify({
                    personType: "manager",
                    personId,
                    messageType: "text",
                    text: message,
                }),
            }
        );

        return response.ok;
    } catch (error) {
        console.error("채널톡 메시지 전송 중 오류:", error);
        return false;
    }
}

/**
 * 채널톡 채팅 상태 변경
 */
export async function updateChannelTalkChatState(
    chatId: string,
    state: "opened" | "closed" | "snoozed"
): Promise<boolean> {
    try {
        const response = await fetch(
            `${CHANNELTALK_API_BASE_URL}/user-chats/${chatId}`,
            {
                method: "PATCH",
                headers: getChannelTalkHeaders(),
                body: JSON.stringify({ state }),
            }
        );

        return response.ok;
    } catch (error) {
        console.error("채널톡 채팅 상태 변경 중 오류:", error);
        return false;
    }
}

/**
 * 채널톡 사용자 정보 조회
 */
export async function getChannelTalkUser(userId: string) {
    try {
        const response = await fetch(
            `${CHANNELTALK_API_BASE_URL}/users/${userId}`,
            {
                method: "GET",
                headers: getChannelTalkHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `채널톡 API 오류: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error("채널톡 사용자 조회 중 오류:", error);
        throw error;
    }
}
