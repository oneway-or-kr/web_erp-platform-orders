"use client";

import React from "react";
import Link from "next/link";
import { CSTicket } from "@/lib/cs-db/types";
import {
    TICKET_STATUS_LABELS,
    PLATFORM_LABELS,
    CONV_CHANNEL_LABELS,
    STATUS_COLORS,
    PLATFORM_COLORS,
    CONV_CHANNEL_COLORS,
    formatKoreanDateTime,
    formatKoreanDate,
    formatRelativeTime,
    generateTicketReference,
    truncateText,
    formatTags,
    formatPhoneNumber,
} from "@/lib/cs-db/utils";

interface TicketListProps {
    tickets: CSTicket[];
    loading: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onTicketUpdate: () => void;
}

/**
 * CS 티켓 목록 컴포넌트 (새로운 스키마 기반)
 */
export default function TicketList({
    tickets,
    loading,
    pagination,
    onPageChange,
    onTicketUpdate,
}: TicketListProps) {
    // 로딩 상태
    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="flex space-x-2">
                                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 빈 상태
    if (tickets.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="bg-gray-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                    <svg
                        className="h-8 w-8 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    티켓이 없습니다
                </h3>
                <p className="text-gray-600">
                    현재 조건에 맞는 CS 티켓이 없습니다. 필터를 조정하거나
                    새로운 문의를 기다려보세요.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* 티켓 목록 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                        CS 티켓 목록
                    </h2>
                    <span className="text-sm text-gray-500">
                        총 {pagination.total}개의 티켓
                    </span>
                </div>
            </div>

            {/* 티켓 목록 */}
            <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                    <div
                        key={ticket.conv_id}
                        className="p-6 hover:bg-gray-50 transition-colors duration-150"
                    >
                        <div className="flex items-start justify-between">
                            {/* 티켓 정보 */}
                            <div className="flex-1 min-w-0">
                                {/* 제목과 참조 ID */}
                                <div className="flex items-center space-x-3 mb-2">
                                    <Link
                                        href={`/dashboard/cs-db/${ticket.conv_id}`}
                                        className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate"
                                    >
                                        {ticket.client_name} -{" "}
                                        {ticket.order_number}
                                    </Link>
                                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        #
                                        {generateTicketReference(
                                            ticket.conv_id
                                        )}
                                    </span>
                                </div>

                                {/* 고객 정보 */}
                                <div className="mb-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                고객:
                                            </span>{" "}
                                            {ticket.client_name}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                전화:
                                            </span>{" "}
                                            {formatPhoneNumber(
                                                ticket.client_phone
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                수령인:
                                            </span>{" "}
                                            {ticket.receiver_name}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                수령인 전화:
                                            </span>{" "}
                                            {formatPhoneNumber(
                                                ticket.receiver_phone
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 주문 정보 */}
                                <div className="mb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                주문번호:
                                            </span>{" "}
                                            {ticket.order_number}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                접수일:
                                            </span>{" "}
                                            {formatKoreanDate(
                                                ticket.received_date
                                            )}
                                        </div>
                                        {ticket.return_tracknum && (
                                            <div>
                                                <span className="font-medium text-gray-900">
                                                    회수송장:
                                                </span>{" "}
                                                {ticket.return_tracknum}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 시스템 정보 */}
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>대화 ID: {ticket.conv_id}</div>
                                    {ticket.created_at && (
                                        <div>
                                            생성:{" "}
                                            {formatRelativeTime(
                                                ticket.created_at
                                            )}
                                        </div>
                                    )}
                                    {ticket.updated_at &&
                                        ticket.updated_at !==
                                            ticket.created_at && (
                                            <div>
                                                수정:{" "}
                                                {formatRelativeTime(
                                                    ticket.updated_at
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* 태그 */}
                                {ticket.tags && ticket.tags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {ticket.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 티켓 상태와 메타 정보 */}
                            <div className="flex flex-col items-end space-y-2 ml-4">
                                <div className="flex flex-col space-y-2">
                                    {/* 상태 */}
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            STATUS_COLORS[ticket.status]
                                        }`}
                                    >
                                        {TICKET_STATUS_LABELS[ticket.status]}
                                    </span>

                                    {/* 플랫폼 */}
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            PLATFORM_COLORS[
                                                ticket.platform as keyof typeof PLATFORM_COLORS
                                            ] || "text-gray-600 bg-gray-100"
                                        }`}
                                    >
                                        {PLATFORM_LABELS[
                                            ticket.platform as keyof typeof PLATFORM_LABELS
                                        ] || ticket.platform}
                                    </span>

                                    {/* CS 인입 채널 */}
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            CONV_CHANNEL_COLORS[
                                                ticket.conv_channel as keyof typeof CONV_CHANNEL_COLORS
                                            ] || "text-gray-600 bg-gray-100"
                                        }`}
                                    >
                                        {CONV_CHANNEL_LABELS[
                                            ticket.conv_channel as keyof typeof CONV_CHANNEL_LABELS
                                        ] || ticket.conv_channel}
                                    </span>
                                </div>

                                {/* 액션 버튼 */}
                                <Link
                                    href={`/dashboard/cs-db/${ticket.conv_id}`}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    상세 보기
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            <p>
                                총{" "}
                                <span className="font-medium">
                                    {pagination.total}
                                </span>
                                개 중{" "}
                                <span className="font-medium">
                                    {(pagination.page - 1) * pagination.limit +
                                        1}
                                </span>
                                -
                                <span className="font-medium">
                                    {Math.min(
                                        pagination.page * pagination.limit,
                                        pagination.total
                                    )}
                                </span>
                                개 표시
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            {/* 이전 페이지 */}
                            <button
                                onClick={() =>
                                    onPageChange(pagination.page - 1)
                                }
                                disabled={pagination.page <= 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">이전</span>
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* 페이지 번호들 */}
                            {Array.from(
                                { length: pagination.totalPages },
                                (_, i) => i + 1
                            )
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === pagination.totalPages ||
                                        Math.abs(page - pagination.page) <= 2
                                )
                                .map((page, index, array) => (
                                    <React.Fragment key={page}>
                                        {index > 0 &&
                                            array[index - 1] !== page - 1 && (
                                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                    ...
                                                </span>
                                            )}
                                        <button
                                            onClick={() => onPageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === pagination.page
                                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))}

                            {/* 다음 페이지 */}
                            <button
                                onClick={() =>
                                    onPageChange(pagination.page + 1)
                                }
                                disabled={
                                    pagination.page >= pagination.totalPages
                                }
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">다음</span>
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
