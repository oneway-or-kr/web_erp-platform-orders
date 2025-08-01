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
} from "@/lib/cs-db/utils";

interface TicketStatsProps {
    tickets: CSTicket[];
}

/**
 * CS 티켓 통계 컴포넌트 (새로운 스키마 기반)
 */
export default function TicketStats({ tickets }: TicketStatsProps) {
    // 상태별 통계 계산
    const statusStats = Object.keys(TICKET_STATUS_LABELS).reduce(
        (acc, status) => {
            acc[status] = tickets.filter(
                (ticket) => ticket.status === status
            ).length;
            return acc;
        },
        {} as Record<string, number>
    );

    // 플랫폼별 통계 계산
    const platformStats = Object.keys(PLATFORM_LABELS).reduce(
        (acc, platform) => {
            acc[platform] = tickets.filter(
                (ticket) => ticket.platform === platform
            ).length;
            return acc;
        },
        {} as Record<string, number>
    );

    // CS 인입 채널별 통계 계산
    const channelStats = Object.keys(CONV_CHANNEL_LABELS).reduce(
        (acc, channel) => {
            acc[channel] = tickets.filter(
                (ticket) => ticket.conv_channel === channel
            ).length;
            return acc;
        },
        {} as Record<string, number>
    );

    // 오늘 접수된 티켓 수
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const todayTickets = tickets.filter(
        (ticket) => ticket.received_date === today
    ).length;

    // 이번 주 접수된 티켓 수
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    const thisWeekStart = thisWeek.toISOString().split("T")[0];
    const thisWeekTickets = tickets.filter(
        (ticket) => ticket.received_date >= thisWeekStart
    ).length;

    // 평균 처리 시간 계산 (완료된 티켓 기준)
    const completedTickets = tickets.filter(
        (ticket) => ticket.status === "완료"
    );
    const avgProcessingTime =
        completedTickets.length > 0
            ? completedTickets.reduce((acc, ticket) => {
                  if (!ticket.created_at || !ticket.updated_at) return acc;
                  const created = new Date(ticket.created_at);
                  const updated = new Date(ticket.updated_at);
                  return acc + (updated.getTime() - created.getTime());
              }, 0) / completedTickets.length
            : 0;

    const avgProcessingHours = Math.round(avgProcessingTime / (1000 * 60 * 60));

    // 대기 중인 티켓 수 (접수, 처리중, 보류)
    const pendingTickets = tickets.filter((ticket) =>
        ["접수", "처리중", "보류"].includes(ticket.status)
    ).length;

    return (
        <div className="space-y-6">
            {/* 주요 지표 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 전체 티켓 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                전체 티켓
                            </p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {tickets.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 대기 중인 티켓 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-yellow-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                대기 중
                            </p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {pendingTickets}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 오늘 접수 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                오늘 접수
                            </p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {todayTickets}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 이번 주 접수 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                이번 주 접수
                            </p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {thisWeekTickets}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 분포 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 상태별 분포 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        상태별 분포
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(statusStats).map(([status, count]) => (
                            <div
                                key={status}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center">
                                    <span
                                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                            STATUS_COLORS[
                                                status as keyof typeof STATUS_COLORS
                                            ]?.split(" ")[1] || "bg-gray-100"
                                        }`}
                                    ></span>
                                    <span className="text-sm text-gray-700">
                                        {
                                            TICKET_STATUS_LABELS[
                                                status as keyof typeof TICKET_STATUS_LABELS
                                            ]
                                        }
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 플랫폼별 분포 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        플랫폼별 분포
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(platformStats)
                            .filter(([_, count]) => count > 0)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([platform, count]) => (
                                <div
                                    key={platform}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                                PLATFORM_COLORS[
                                                    platform as keyof typeof PLATFORM_COLORS
                                                ]?.split(" ")[1] ||
                                                "bg-gray-100"
                                            }`}
                                        ></span>
                                        <span className="text-sm text-gray-700">
                                            {
                                                PLATFORM_LABELS[
                                                    platform as keyof typeof PLATFORM_LABELS
                                                ]
                                            }
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {count}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* CS 인입 채널별 분포 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        CS 인입 채널별 분포
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(channelStats)
                            .filter(([_, count]) => count > 0)
                            .sort((a, b) => b[1] - a[1])
                            .map(([channel, count]) => (
                                <div
                                    key={channel}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                                CONV_CHANNEL_COLORS[
                                                    channel as keyof typeof CONV_CHANNEL_COLORS
                                                ]?.split(" ")[1] ||
                                                "bg-gray-100"
                                            }`}
                                        ></span>
                                        <span className="text-sm text-gray-700">
                                            {
                                                CONV_CHANNEL_LABELS[
                                                    channel as keyof typeof CONV_CHANNEL_LABELS
                                                ]
                                            }
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {count}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* 성과 지표 */}
            {avgProcessingHours > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        성과 지표
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900">
                                {avgProcessingHours}시간
                            </div>
                            <div className="text-sm text-gray-600">
                                평균 처리 시간
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900">
                                {completedTickets.length}
                            </div>
                            <div className="text-sm text-gray-600">
                                완료된 티켓
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900">
                                {tickets.length > 0
                                    ? Math.round(
                                          (completedTickets.length /
                                              tickets.length) *
                                              100
                                      )
                                    : 0}
                                %
                            </div>
                            <div className="text-sm text-gray-600">완료율</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
