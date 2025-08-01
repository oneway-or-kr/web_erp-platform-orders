/**
 * CS-DB 시스템 관련 타입 정의
 */

// 채널톡 웹훅 관련 타입들
export interface ChannelTalkWebhookPayload {
    event: string; // "push", "upsert", "update" 등
    type: string; // "message", "userChat", "user" 등
    entity: unknown; // 실제 데이터 객체
    refers?: {
        chat?: ChannelTalkChat;
        user?: ChannelTalkUser;
        userChat?: ChannelTalkUserChat;
        message?: ChannelTalkMessage;
    };
}

export interface ChannelTalkChat {
    id: string;
    type: "userChat" | "supportBotChat";
    createdAt: string;
    state: "opened" | "closed" | "snoozed";
    readAt?: string;
    updatedAt: string;
    personType: "user" | "manager";
    personId: string;
    rootMessageId: string;
    assigneeId?: string;
    followUpState?: "idle" | "pending" | "resolved";
    tags?: string[];
}

export interface ChannelTalkUser {
    id: string;
    name?: string;
    avatarUrl?: string;
    profile?: ChannelTalkUserProfile;
    alert: number;
    tags?: string[];
    language: string;
    unsubscribed: boolean;
    systemTags?: string[];
    email?: string;
    mobileNumber?: string;
    channelId: string;
    memberId?: string;
}

// 채널톡 사용자 프로필 (상담 관련 정보 포함)
export interface ChannelTalkUserProfile {
    name?: string;
    email?: string;
    avatarUrl?: string;
    phone?: string;
    mobile?: string;
    phoneNumber?: string;
    mobileNumber?: string;

    // 주문 관련 정보
    order_number?: string;
    orderNumber?: string;
    order_id?: string;
    orderId?: string;
    주문번호?: string;

    // 수령자 정보
    receiver_name?: string;
    receiverName?: string;
    recipient_name?: string;
    recipientName?: string;
    수령자?: string;
    수령인?: string;

    receiver_phone?: string;
    receiverPhone?: string;
    recipient_phone?: string;
    recipientPhone?: string;
    수령자전화?: string;
    수령인전화?: string;

    // 구매처/플랫폼 정보
    platform?: string;
    shop?: string;
    store?: string;
    marketplace?: string;
    구매처?: string;
    쇼핑몰?: string;

    // 기타 추가 필드들
    [key: string]: unknown;
}

export interface ChannelTalkUserChat {
    id: string;
    personType: "user" | "manager";
    personId: string;
    chatType: "userChat" | "supportBotChat";
    chatId: string;
}

export interface ChannelTalkMessage {
    id: string;
    chatType: "userChat" | "supportBotChat";
    chatId: string;
    personType: "user" | "manager";
    personId: string;
    createdAt: string;
    updatedAt: string;
    messageType: "text" | "image" | "file" | "audio" | "video";
    text?: string;
    file?: {
        url: string;
        name: string;
        size: number;
        type: string;
    };
}

// CS 티켓 관련 타입들 (Supabase 스키마 기반)
export interface CSTicket {
    conv_id: string; // 대화 ID (uuid)
    client_name: string; // 고객명
    client_phone: string; // 고객 전화번호
    order_number: string; // 주문번호
    received_date: string; // CS 접수일 (date)
    receiver_name: string; // 수령인명
    receiver_phone: string; // 수령인 전화번호
    platform: string; // 플랫폼
    tags: string[] | null; // 태그 (json)
    return_tracknum: string | null; // 회수 송장 번호
    status: TicketStatus; // CS 상태
    conv_channel: string; // CS 인입 채널
    created_at?: string; // 생성일시 (Supabase 자동 생성)
    updated_at?: string; // 수정일시 (Supabase 자동 업데이트)
}

export type TicketStatus =
    | "접수" // 접수됨
    | "처리중" // 처리 중
    | "보류" // 보류
    | "완료" // 완료
    | "취소"; // 취소

export type TicketPlatform =
    | "네이버" // 네이버
    | "쿠팡" // 쿠팡
    | "11번가" // 11번가
    | "ESM" // ESM
    | "카카오" // 카카오
    | "토스" // 토스
    | "올웨이즈" // 올웨이즈
    | "오하우스" // 오하우스
    | "카페24" // 카페24
    | "기타"; // 기타

export type ConvChannel =
    | "채널톡" // 채널톡
    | "전화" // 전화
    | "이메일" // 이메일
    | "카카오톡" // 카카오톡
    | "문자" // 문자
    | "기타"; // 기타

// API 응답 타입들
export interface APIResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    tickets: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// 티켓 생성/수정을 위한 입력 타입들
export interface CreateTicketInput {
    conv_id: string; // 대화 ID (채널톡 chat ID)
    client_name: string; // 고객명
    client_phone: string; // 고객 전화번호
    order_number: string; // 주문번호
    received_date: string; // CS 접수일
    receiver_name: string; // 수령인명
    receiver_phone: string; // 수령인 전화번호
    platform: string; // 플랫폼
    tags?: string[]; // 태그
    return_tracknum?: string | null; // 회수 송장 번호
    status?: TicketStatus; // CS 상태 (기본값: "접수")
    conv_channel: string; // CS 인입 채널
}

export interface UpdateTicketInput {
    client_name?: string;
    client_phone?: string;
    order_number?: string;
    received_date?: string;
    receiver_name?: string;
    receiver_phone?: string;
    platform?: string;
    tags?: string[];
    return_tracknum?: string | null;
    status?: TicketStatus;
    conv_channel?: string;
}

// 티켓 조회를 위한 필터 타입들
export interface TicketFilters {
    status?: TicketStatus;
    platform?: string;
    conv_channel?: string;
    client_name?: string;
    order_number?: string;
    tags?: string[];
    received_after?: string; // 접수일 이후
    received_before?: string; // 접수일 이전
    search?: string; // 고객명, 주문번호, 수령인명 검색
}

export interface TicketQueryParams extends TicketFilters {
    page?: number;
    limit?: number;
    sortBy?: "received_date" | "created_at" | "updated_at";
    sortOrder?: "asc" | "desc";
}
