"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    CSTicket,
    TicketFilters as TicketFiltersType,
    PaginatedResponse,
} from "@/lib/cs-db/types";
import TicketList from "./components/TicketList";
import TicketFilters from "./components/TicketFilters";
import TicketStats from "./components/TicketStats";

/**
 * CS 티켓 관리 메인 페이지
 */
export default function CSDBPage() {
    const [tickets, setTickets] = useState<CSTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TicketFiltersType>({});
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // 티켓 목록 조회
    const fetchTickets = useCallback(
        async (newFilters?: TicketFiltersType, page: number = 1) => {
            try {
                setLoading(true);
                setError(null);

                const searchParams = new URLSearchParams();
                searchParams.append("page", page.toString());
                searchParams.append("limit", pagination.limit.toString());

                // 필터 파라미터 추가
                const activeFilters = newFilters || filters;
                if (activeFilters.status)
                    searchParams.append("status", activeFilters.status);
                if (activeFilters.platform)
                    searchParams.append("platform", activeFilters.platform);
                if (activeFilters.conv_channel)
                    searchParams.append(
                        "conv_channel",
                        activeFilters.conv_channel
                    );
                if (activeFilters.client_name)
                    searchParams.append(
                        "client_name",
                        activeFilters.client_name
                    );
                if (activeFilters.order_number)
                    searchParams.append(
                        "order_number",
                        activeFilters.order_number
                    );
                if (activeFilters.search)
                    searchParams.append("search", activeFilters.search);
                if (activeFilters.tags?.length)
                    searchParams.append("tags", activeFilters.tags.join(","));
                if (activeFilters.received_after)
                    searchParams.append(
                        "received_after",
                        activeFilters.received_after
                    );
                if (activeFilters.received_before)
                    searchParams.append(
                        "received_before",
                        activeFilters.received_before
                    );

                const response = await fetch(
                    `/api/cs-db/tickets?${searchParams}`
                );
                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.error || "티켓 목록 조회에 실패했습니다."
                    );
                }

                const data: PaginatedResponse<CSTicket> = result.data;
                setTickets(data.tickets);
                setPagination(data.pagination);
            } catch (err) {
                console.error("티켓 목록 조회 오류:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 오류가 발생했습니다."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // 컴포넌트 마운트 시 티켓 목록 조회
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // 필터 변경 핸들러
    const handleFiltersChange = (newFilters: TicketFiltersType) => {
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchTickets(newFilters, 1);
    };

    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }));
        fetchTickets(filters, page);
    };

    // 티켓 상태 변경 핸들러
    const handleTicketUpdate = () => {
        fetchTickets(filters, pagination.page);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        CS 티켓 관리
                    </h1>
                    <p className="text-gray-600">
                        채널톡을 통해 접수된 고객 문의를 관리하고 처리할 수
                        있습니다.
                    </p>
                </div>

                {/* 통계 섹션 */}
                <div className="mb-8">
                    <TicketStats tickets={tickets} />
                </div>

                {/* 필터 섹션 */}
                <div className="mb-6">
                    <TicketFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    오류가 발생했습니다
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        onClick={() =>
                                            fetchTickets(
                                                filters,
                                                pagination.page
                                            )
                                        }
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 티켓 목록 */}
                <div className="bg-white shadow-sm rounded-lg">
                    <TicketList
                        tickets={tickets}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onTicketUpdate={handleTicketUpdate}
                    />
                </div>
            </div>
        </div>
    );
}
