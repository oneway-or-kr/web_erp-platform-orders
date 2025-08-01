"use client";

import React from "react";
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
    formatPhoneNumber,
    formatTags,
} from "@/lib/cs-db/utils";

interface TicketDetailViewProps {
    ticket: CSTicket;
}

/**
 * CS 티켓 상세 보기 컴포넌트 (새로운 스키마 기반)
 */
export default function TicketDetailView({ ticket }: TicketDetailViewProps) {
    return (
        <div className="p-6">
            {/* 티켓 헤더 */}
            <div className="pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {ticket.client_name} - {ticket.order_number}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                                대화 ID: #
                                {generateTicketReference(ticket.conv_id)}
                            </span>
                            <span>•</span>
                            <span>
                                접수일: {formatKoreanDate(ticket.received_date)}
                            </span>
                            {ticket.created_at && (
                                <>
                                    <span>•</span>
                                    <span>
                                        시스템 등록:{" "}
                                        {formatKoreanDateTime(
                                            ticket.created_at
                                        )}
                                    </span>
                                </>
                            )}
                            {ticket.updated_at &&
                                ticket.updated_at !== ticket.created_at && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            수정:{" "}
                                            {formatRelativeTime(
                                                ticket.updated_at
                                            )}
                                        </span>
                                    </>
                                )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                STATUS_COLORS[ticket.status]
                            }`}
                        >
                            {TICKET_STATUS_LABELS[ticket.status]}
                        </span>
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                PLATFORM_COLORS[
                                    ticket.platform as keyof typeof PLATFORM_COLORS
                                ] || "text-gray-600 bg-gray-100"
                            }`}
                        >
                            {PLATFORM_LABELS[
                                ticket.platform as keyof typeof PLATFORM_LABELS
                            ] || ticket.platform}
                        </span>
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
                </div>
            </div>

            {/* 고객 정보 */}
            <div className="py-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    고객 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                고객명
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {ticket.client_name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                고객 전화번호
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {formatPhoneNumber(ticket.client_phone)}
                            </dd>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                수령인명
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {ticket.receiver_name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                수령인 전화번호
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {formatPhoneNumber(ticket.receiver_phone)}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* 주문 정보 */}
            <div className="py-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    주문 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                주문번호
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {ticket.order_number}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                플랫폼
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {PLATFORM_LABELS[
                                    ticket.platform as keyof typeof PLATFORM_LABELS
                                ] || ticket.platform}
                            </dd>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                접수일
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {formatKoreanDate(ticket.received_date)}
                            </dd>
                        </div>

                        {ticket.return_tracknum && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    회수 송장번호
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {ticket.return_tracknum}
                                </dd>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CS 정보 */}
            <div className="py-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    CS 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                상태
                            </dt>
                            <dd className="mt-1">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        STATUS_COLORS[ticket.status]
                                    }`}
                                >
                                    {TICKET_STATUS_LABELS[ticket.status]}
                                </span>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                CS 인입 채널
                            </dt>
                            <dd className="mt-1">
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
                            </dd>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                대화 ID
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 font-mono">
                                {ticket.conv_id}
                            </dd>
                        </div>

                        {ticket.tags && ticket.tags.length > 0 && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    태그
                                </dt>
                                <dd className="mt-1">
                                    <div className="flex flex-wrap gap-2">
                                        {ticket.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 시스템 정보 */}
            <div className="py-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    시스템 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {ticket.created_at && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    생성일시
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatKoreanDateTime(ticket.created_at)}
                                </dd>
                            </div>
                        )}

                        {ticket.updated_at && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    수정일시
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatKoreanDateTime(ticket.updated_at)}
                                </dd>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                티켓 참조 ID
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 font-mono">
                                #{generateTicketReference(ticket.conv_id)}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
