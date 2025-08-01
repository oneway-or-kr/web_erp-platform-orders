"use client";

import React, { useState } from "react";
import {
    TicketFilters as TicketFiltersType,
    TicketStatus,
    TicketPlatform,
    ConvChannel,
} from "@/lib/cs-db/types";
import {
    TICKET_STATUS_LABELS,
    PLATFORM_LABELS,
    CONV_CHANNEL_LABELS,
} from "@/lib/cs-db/utils";

interface TicketFiltersProps {
    filters: TicketFiltersType;
    onFiltersChange: (filters: TicketFiltersType) => void;
}

/**
 * CS 티켓 필터 컴포넌트 (새로운 스키마 기반)
 */
export default function TicketFilters({
    filters,
    onFiltersChange,
}: TicketFiltersProps) {
    const [localFilters, setLocalFilters] =
        useState<TicketFiltersType>(filters);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // 필터 값 변경 핸들러
    const handleFilterChange = <K extends keyof TicketFiltersType>(
        key: K,
        value: TicketFiltersType[K]
    ) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
    };

    // 필터 적용
    const applyFilters = () => {
        onFiltersChange(localFilters);
    };

    // 필터 초기화
    const resetFilters = () => {
        const emptyFilters: TicketFiltersType = {};
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    // 날짜 필터 설정 (최근 7일, 30일 등)
    const setDateFilter = (days: number) => {
        const now = new Date();
        const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const newFilters = {
            ...localFilters,
            received_after: past.toISOString().split("T")[0], // YYYY-MM-DD 형식
            received_before: now.toISOString().split("T")[0],
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">필터</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        {showAdvanced ? "간단히 보기" : "고급 필터"}
                    </button>
                    <button
                        onClick={resetFilters}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                        초기화
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 검색어 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        검색어
                    </label>
                    <input
                        type="text"
                        value={localFilters.search || ""}
                        onChange={(e) =>
                            handleFilterChange("search", e.target.value)
                        }
                        placeholder="고객명, 주문번호, 수령인명 검색..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                {/* 상태 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        상태
                    </label>
                    <select
                        value={localFilters.status || ""}
                        onChange={(e) =>
                            handleFilterChange(
                                "status",
                                e.target.value === ""
                                    ? undefined
                                    : (e.target.value as TicketStatus)
                            )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">모든 상태</option>
                        {Object.entries(TICKET_STATUS_LABELS).map(
                            ([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* 플랫폼 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        플랫폼
                    </label>
                    <select
                        value={localFilters.platform || ""}
                        onChange={(e) =>
                            handleFilterChange("platform", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">모든 플랫폼</option>
                        {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* CS 인입 채널 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CS 인입 채널
                    </label>
                    <select
                        value={localFilters.conv_channel || ""}
                        onChange={(e) =>
                            handleFilterChange("conv_channel", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">모든 채널</option>
                        {Object.entries(CONV_CHANNEL_LABELS).map(
                            ([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </div>

            {/* 고급 필터 */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
                    {/* 고객명 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            고객명
                        </label>
                        <input
                            type="text"
                            value={localFilters.client_name || ""}
                            onChange={(e) =>
                                handleFilterChange(
                                    "client_name",
                                    e.target.value
                                )
                            }
                            placeholder="고객명 입력..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* 주문번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주문번호
                        </label>
                        <input
                            type="text"
                            value={localFilters.order_number || ""}
                            onChange={(e) =>
                                handleFilterChange(
                                    "order_number",
                                    e.target.value
                                )
                            }
                            placeholder="주문번호 입력..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* 태그 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            태그
                        </label>
                        <input
                            type="text"
                            value={localFilters.tags?.join(", ") || ""}
                            onChange={(e) =>
                                handleFilterChange(
                                    "tags",
                                    e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean)
                                )
                            }
                            placeholder="태그1, 태그2..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* 접수일 시작 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            접수일 (시작)
                        </label>
                        <input
                            type="date"
                            value={localFilters.received_after || ""}
                            onChange={(e) =>
                                handleFilterChange(
                                    "received_after",
                                    e.target.value
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* 접수일 끝 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            접수일 (끝)
                        </label>
                        <input
                            type="date"
                            value={localFilters.received_before || ""}
                            onChange={(e) =>
                                handleFilterChange(
                                    "received_before",
                                    e.target.value
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            )}

            {/* 빠른 날짜 필터 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    빠른 날짜 필터
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setDateFilter(1)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        오늘
                    </button>
                    <button
                        onClick={() => setDateFilter(7)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        최근 7일
                    </button>
                    <button
                        onClick={() => setDateFilter(30)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        최근 30일
                    </button>
                    <button
                        onClick={() => setDateFilter(90)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        최근 90일
                    </button>
                    <button
                        onClick={() => {
                            const newFilters = {
                                ...localFilters,
                                received_after: undefined,
                                received_before: undefined,
                            };
                            setLocalFilters(newFilters);
                            onFiltersChange(newFilters);
                        }}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        전체 기간
                    </button>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3">
                <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    초기화
                </button>
                <button
                    onClick={applyFilters}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    필터 적용
                </button>
            </div>
        </div>
    );
}
