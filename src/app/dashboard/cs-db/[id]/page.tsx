"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CSTicket, UpdateTicketInput } from "@/lib/cs-db/types";
import TicketDetailView from "../components/TicketDetailView";
import TicketEditForm from "../components/TicketEditForm";

/**
 * CS 티켓 상세/수정 페이지
 */
export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;

    const [ticket, setTicket] = useState<CSTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // 티켓 상세 정보 조회
    const fetchTicket = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/cs-db/tickets/${ticketId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "티켓 조회에 실패했습니다.");
            }

            setTicket(result.data);
        } catch (err) {
            console.error("티켓 조회 오류:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "알 수 없는 오류가 발생했습니다."
            );
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    // 티켓 정보 업데이트
    const handleTicketUpdate = async (updateData: UpdateTicketInput) => {
        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`/api/cs-db/tickets/${ticketId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.error || "티켓 업데이트에 실패했습니다."
                );
            }

            setTicket(result.data);
            setEditing(false);

            // 성공 알림
            alert("티켓이 성공적으로 업데이트되었습니다.");
        } catch (err) {
            console.error("티켓 업데이트 오류:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "알 수 없는 오류가 발생했습니다."
            );
        } finally {
            setSaving(false);
        }
    };

    // 티켓 삭제
    const handleTicketDelete = async () => {
        if (
            !confirm(
                "정말로 이 티켓을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
            )
        ) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/cs-db/tickets/${ticketId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "티켓 삭제에 실패했습니다.");
            }

            alert("티켓이 성공적으로 삭제되었습니다.");
            router.push("/dashboard/cs-db");
        } catch (err) {
            console.error("티켓 삭제 오류:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "알 수 없는 오류가 발생했습니다."
            );
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 티켓 정보 조회
    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId, fetchTicket]);

    // 로딩 상태
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        티켓 정보를 불러오는 중...
                    </p>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                        <svg
                            className="h-8 w-8 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        오류가 발생했습니다
                    </h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-x-4">
                        <button
                            onClick={fetchTicket}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => router.push("/dashboard/cs-db")}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 티켓을 찾을 수 없는 경우
    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        티켓을 찾을 수 없습니다
                    </h2>
                    <p className="text-gray-600 mb-4">
                        요청하신 티켓이 존재하지 않거나 삭제되었을 수 있습니다.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/cs-db")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* 페이지 헤더 */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.push("/dashboard/cs-db")}
                                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
                            >
                                <svg
                                    className="h-5 w-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                티켓 목록으로 돌아가기
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                티켓 상세 정보
                            </h1>
                            <p className="text-gray-600">
                                티켓 ID:{" "}
                                {ticket.conv_id.substring(0, 8).toUpperCase()}
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            {!editing && (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        편집
                                    </button>
                                    <button
                                        onClick={handleTicketDelete}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        삭제
                                    </button>
                                </>
                            )}
                            {editing && (
                                <button
                                    onClick={() => setEditing(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </div>
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
                                    오류
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 티켓 상세 내용 */}
                <div className="bg-white shadow-sm rounded-lg">
                    {editing ? (
                        <TicketEditForm
                            ticket={ticket}
                            onSave={handleTicketUpdate}
                            onCancel={() => setEditing(false)}
                            saving={saving}
                        />
                    ) : (
                        <TicketDetailView ticket={ticket} />
                    )}
                </div>
            </div>
        </div>
    );
}
