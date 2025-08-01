"use client";

import React, { useState } from "react";
import {
    CSTicket,
    UpdateTicketInput,
    TicketStatus,
    TicketPlatform,
    ConvChannel,
} from "@/lib/cs-db/types";
import {
    TICKET_STATUS_LABELS,
    PLATFORM_LABELS,
    CONV_CHANNEL_LABELS,
    isValidStatus,
    isValidPlatform,
    isValidConvChannel,
} from "@/lib/cs-db/utils";

interface TicketEditFormProps {
    ticket: CSTicket;
    onSave: (updateData: UpdateTicketInput) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

/**
 * CS 티켓 편집 폼 컴포넌트 (새로운 스키마 기반)
 */
export default function TicketEditForm({
    ticket,
    onSave,
    onCancel,
    saving,
}: TicketEditFormProps) {
    const [formData, setFormData] = useState<UpdateTicketInput>({
        client_name: ticket.client_name,
        client_phone: ticket.client_phone,
        order_number: ticket.order_number,
        received_date: ticket.received_date,
        receiver_name: ticket.receiver_name,
        receiver_phone: ticket.receiver_phone,
        platform: ticket.platform,
        tags: ticket.tags || [],
        return_tracknum: ticket.return_tracknum || "",
        status: ticket.status,
        conv_channel: ticket.conv_channel,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [tagsInput, setTagsInput] = useState(
        ticket.tags ? ticket.tags.join(", ") : ""
    );

    // 폼 필드 변경 핸들러
    const handleChange = <K extends keyof UpdateTicketInput>(
        field: K,
        value: UpdateTicketInput[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // 에러 클리어
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    // 태그 입력 핸들러
    const handleTagsChange = (value: string) => {
        setTagsInput(value);
        const tags = value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        handleChange("tags", tags);
    };

    // 폼 검증
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.client_name?.trim()) {
            newErrors.client_name = "고객명을 입력해주세요.";
        }

        if (!formData.client_phone?.trim()) {
            newErrors.client_phone = "고객 전화번호를 입력해주세요.";
        }

        if (!formData.order_number?.trim()) {
            newErrors.order_number = "주문번호를 입력해주세요.";
        }

        if (!formData.received_date?.trim()) {
            newErrors.received_date = "접수일을 입력해주세요.";
        } else {
            // 날짜 형식 검증 (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(formData.received_date)) {
                newErrors.received_date =
                    "날짜는 YYYY-MM-DD 형식이어야 합니다.";
            }
        }

        if (!formData.receiver_name?.trim()) {
            newErrors.receiver_name = "수령인명을 입력해주세요.";
        }

        if (!formData.receiver_phone?.trim()) {
            newErrors.receiver_phone = "수령인 전화번호를 입력해주세요.";
        }

        if (!formData.platform?.trim()) {
            newErrors.platform = "플랫폼을 선택해주세요.";
        } else if (!isValidPlatform(formData.platform)) {
            newErrors.platform = "유효하지 않은 플랫폼입니다.";
        }

        if (!formData.conv_channel?.trim()) {
            newErrors.conv_channel = "CS 인입 채널을 선택해주세요.";
        } else if (!isValidConvChannel(formData.conv_channel)) {
            newErrors.conv_channel = "유효하지 않은 CS 인입 채널입니다.";
        }

        if (formData.status && !isValidStatus(formData.status)) {
            newErrors.status = "유효하지 않은 상태입니다.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave(formData);
        } catch (error) {
            console.error("티켓 저장 중 오류:", error);
        }
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 고객 정보 */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        고객 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                고객명 *
                            </label>
                            <input
                                type="text"
                                value={formData.client_name || ""}
                                onChange={(e) =>
                                    handleChange("client_name", e.target.value)
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.client_name
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="고객명을 입력하세요"
                            />
                            {errors.client_name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.client_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                고객 전화번호 *
                            </label>
                            <input
                                type="tel"
                                value={formData.client_phone || ""}
                                onChange={(e) =>
                                    handleChange("client_phone", e.target.value)
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.client_phone
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="010-1234-5678"
                            />
                            {errors.client_phone && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.client_phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                수령인명 *
                            </label>
                            <input
                                type="text"
                                value={formData.receiver_name || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "receiver_name",
                                        e.target.value
                                    )
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.receiver_name
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="수령인명을 입력하세요"
                            />
                            {errors.receiver_name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.receiver_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                수령인 전화번호 *
                            </label>
                            <input
                                type="tel"
                                value={formData.receiver_phone || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "receiver_phone",
                                        e.target.value
                                    )
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.receiver_phone
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="010-1234-5678"
                            />
                            {errors.receiver_phone && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.receiver_phone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 주문 정보 */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        주문 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                주문번호 *
                            </label>
                            <input
                                type="text"
                                value={formData.order_number || ""}
                                onChange={(e) =>
                                    handleChange("order_number", e.target.value)
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.order_number
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                                placeholder="주문번호를 입력하세요"
                            />
                            {errors.order_number && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.order_number}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                접수일 *
                            </label>
                            <input
                                type="date"
                                value={formData.received_date || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "received_date",
                                        e.target.value
                                    )
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.received_date
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.received_date && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.received_date}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                플랫폼 *
                            </label>
                            <select
                                value={formData.platform || ""}
                                onChange={(e) =>
                                    handleChange("platform", e.target.value)
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.platform
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            >
                                <option value="">플랫폼을 선택하세요</option>
                                {Object.entries(PLATFORM_LABELS).map(
                                    ([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            {errors.platform && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.platform}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                회수 송장번호
                            </label>
                            <input
                                type="text"
                                value={formData.return_tracknum || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "return_tracknum",
                                        e.target.value
                                    )
                                }
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="회수 송장번호를 입력하세요"
                            />
                        </div>
                    </div>
                </div>

                {/* CS 정보 */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        CS 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                상태 *
                            </label>
                            <select
                                value={formData.status || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "status",
                                        e.target.value as TicketStatus
                                    )
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.status
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            >
                                {Object.entries(TICKET_STATUS_LABELS).map(
                                    ([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                CS 인입 채널 *
                            </label>
                            <select
                                value={formData.conv_channel || ""}
                                onChange={(e) =>
                                    handleChange("conv_channel", e.target.value)
                                }
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                    errors.conv_channel
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            >
                                <option value="">
                                    CS 인입 채널을 선택하세요
                                </option>
                                {Object.entries(CONV_CHANNEL_LABELS).map(
                                    ([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            {errors.conv_channel && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.conv_channel}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                태그
                            </label>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) =>
                                    handleTagsChange(e.target.value)
                                }
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="태그1, 태그2, 태그3... (쉼표로 구분)"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                쉼표(,)로 구분하여 여러 태그를 입력할 수
                                있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "저장 중..." : "저장하기"}
                    </button>
                </div>
            </form>
        </div>
    );
}
