/**
 * CS-DB 시스템 관련 유틸리티 함수들 (새로운 스키마 기반)
 */

import { TicketStatus, TicketPlatform, ConvChannel } from "./types";

/**
 * 티켓 상태별 한글 라벨
 */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    접수: "접수",
    처리중: "처리중",
    보류: "보류",
    완료: "완료",
    취소: "취소",
};

/**
 * 플랫폼별 한글 라벨
 */
export const PLATFORM_LABELS: Record<TicketPlatform, string> = {
    네이버: "네이버",
    쿠팡: "쿠팡",
    "11번가": "11번가",
    ESM: "ESM",
    카카오: "카카오",
    토스: "토스",
    올웨이즈: "올웨이즈",
    오하우스: "오하우스",
    카페24: "카페24",
    기타: "기타",
};

/**
 * CS 인입 채널별 한글 라벨
 */
export const CONV_CHANNEL_LABELS: Record<ConvChannel, string> = {
    채널톡: "채널톡",
    전화: "전화",
    이메일: "이메일",
    카카오톡: "카카오톡",
    문자: "문자",
    기타: "기타",
};

/**
 * 상태별 색상 클래스 (Tailwind CSS)
 */
export const STATUS_COLORS: Record<TicketStatus, string> = {
    접수: "text-blue-600 bg-blue-100",
    처리중: "text-yellow-600 bg-yellow-100",
    보류: "text-orange-600 bg-orange-100",
    완료: "text-green-600 bg-green-100",
    취소: "text-gray-600 bg-gray-100",
};

/**
 * 플랫폼별 색상 클래스 (Tailwind CSS)
 */
export const PLATFORM_COLORS: Record<TicketPlatform, string> = {
    네이버: "text-green-600 bg-green-100",
    쿠팡: "text-orange-600 bg-orange-100",
    "11번가": "text-red-600 bg-red-100",
    ESM: "text-purple-600 bg-purple-100",
    카카오: "text-yellow-600 bg-yellow-100",
    토스: "text-blue-600 bg-blue-100",
    올웨이즈: "text-indigo-600 bg-indigo-100",
    오하우스: "text-pink-600 bg-pink-100",
    카페24: "text-teal-600 bg-teal-100",
    기타: "text-gray-600 bg-gray-100",
};

/**
 * CS 인입 채널별 색상 클래스 (Tailwind CSS)
 */
export const CONV_CHANNEL_COLORS: Record<ConvChannel, string> = {
    채널톡: "text-purple-600 bg-purple-100",
    전화: "text-green-600 bg-green-100",
    이메일: "text-blue-600 bg-blue-100",
    카카오톡: "text-yellow-600 bg-yellow-100",
    문자: "text-orange-600 bg-orange-100",
    기타: "text-gray-600 bg-gray-100",
};

/**
 * 상태 우선순위 값을 숫자로 변환 (정렬용)
 */
export function getStatusPriority(status: TicketStatus): number {
    const priorities: Record<TicketStatus, number> = {
        접수: 4,
        처리중: 3,
        보류: 2,
        완료: 1,
        취소: 0,
    };
    return priorities[status];
}

/**
 * 대화 ID로부터 짧은 참조 ID 생성
 */
export function generateTicketReference(convId: string): string {
    // UUID의 처음 8자리를 대문자로 변환
    return convId.substring(0, 8).toUpperCase();
}

/**
 * 날짜 문자열을 한국 시간대로 포맷
 */
export function formatKoreanDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Seoul",
    }).format(date);
}

/**
 * 날짜만 포맷 (YYYY-MM-DD)
 */
export function formatKoreanDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Seoul",
    }).format(date);
}

/**
 * 날짜 문자열을 상대 시간으로 포맷 (예: "2시간 전")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return `${minutes}분 전`;
    } else if (hours < 24) {
        return `${hours}시간 전`;
    } else if (days < 30) {
        return `${days}일 전`;
    } else {
        return formatKoreanDate(dateString);
    }
}

/**
 * 텍스트 길이 제한 및 생략 처리
 */
export function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

/**
 * 태그 배열을 문자열로 변환
 */
export function formatTags(tags: string[] | null): string {
    if (!tags || tags.length === 0) return "";
    return tags.join(", ");
}

/**
 * 태그 문자열을 배열로 파싱
 */
export function parseTags(tagString: string): string[] {
    if (!tagString.trim()) return [];
    return tagString
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
}

/**
 * 검색어 하이라이트
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
}

/**
 * 상태 값 유효성 검사
 */
export function isValidStatus(status: string): status is TicketStatus {
    return ["접수", "처리중", "보류", "완료", "취소"].includes(status);
}

/**
 * 플랫폼 값 유효성 검사
 */
export function isValidPlatform(platform: string): platform is TicketPlatform {
    return [
        "네이버",
        "쿠팡",
        "11번가",
        "ESM",
        "카카오",
        "토스",
        "올웨이즈",
        "오하우스",
        "카페24",
        "기타",
    ].includes(platform);
}

/**
 * CS 인입 채널 값 유효성 검사
 */
export function isValidConvChannel(channel: string): channel is ConvChannel {
    return ["채널톡", "전화", "이메일", "카카오톡", "문자", "기타"].includes(
        channel
    );
}

/**
 * 환경변수 유효성 검사
 */
export function validateEnvironmentVariables(): void {
    const requiredVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "CHANNEL_TALK_ACCESS_TOKEN",
        "CHANNEL_TALK_SECRET",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(
            `다음 환경변수가 설정되지 않았습니다: ${missingVars.join(", ")}`
        );
    }
}

/**
 * API 응답 생성 헬퍼
 */
export function createAPIResponse<T>(
    success: boolean,
    data?: T,
    message?: string,
    error?: string
) {
    return {
        success,
        data,
        message,
        error,
    };
}

/**
 * 에러 객체를 안전하게 문자열로 변환
 */
export function normalizeError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "알 수 없는 오류가 발생했습니다.";
}

/**
 * 객체에서 빈 값들을 제거
 */
export function removeEmptyValues<T extends Record<string, unknown>>(
    obj: T
): Partial<T> {
    const result: Partial<T> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
        ) {
            result[key as keyof T] = value as T[keyof T];
        }
    }

    return result;
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone: string): string {
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, "");

    // 11자리 휴대폰 번호
    if (numbers.length === 11) {
        return numbers.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    // 10자리 지역번호
    else if (numbers.length === 10) {
        return numbers.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    }

    return phone; // 포맷팅할 수 없는 경우 원본 반환
}

/**
 * 주문번호 마스킹 (보안용)
 */
export function maskOrderNumber(orderNumber: string): string {
    if (orderNumber.length <= 4) return orderNumber;

    const start = orderNumber.substring(0, 2);
    const end = orderNumber.substring(orderNumber.length - 2);
    const middle = "*".repeat(orderNumber.length - 4);

    return start + middle + end;
}
