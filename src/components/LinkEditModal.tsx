"use client";

import { useState, useEffect } from "react";
import { LinkCategory, LinkItem } from "@/lib/link-hub/types";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface LinkEditModalProps {
    type: "category" | "link";
    data?: LinkCategory | LinkItem;
    categories: LinkCategory[];
    onSave: () => void;
    onCancel: () => void;
}

export default function LinkEditModal({
    type,
    data,
    categories,
    onSave,
    onCancel,
}: LinkEditModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEdit = !!data?.id;

    useEffect(() => {
        if (type === "category") {
            setFormData({
                name: (data as LinkCategory)?.name || "",
                display_order: (data as LinkCategory)?.display_order || 0,
            });
        } else {
            setFormData({
                category_id: (data as LinkItem)?.category_id || "",
                title: (data as LinkItem)?.title || "",
                url: (data as LinkItem)?.url || "",
                icon_url: (data as LinkItem)?.icon_url || "",
                description: (data as LinkItem)?.description || "",
                display_order: (data as LinkItem)?.display_order || 0,
            });
        }
    }, [type, data]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (type === "category") {
            if (!formData.name?.trim()) {
                newErrors.name = "카테고리 이름은 필수입니다.";
            }
        } else {
            if (!formData.title?.trim()) {
                newErrors.title = "링크 제목은 필수입니다.";
            }
            if (!formData.url?.trim()) {
                newErrors.url = "URL은 필수입니다.";
            } else if (!isValidUrl(formData.url)) {
                newErrors.url = "올바른 URL 형식이 아닙니다.";
            }
            if (!formData.category_id) {
                newErrors.category_id = "카테고리를 선택해주세요.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const endpoint =
                type === "category"
                    ? isEdit
                        ? `/api/link-hub/categories/${data?.id}`
                        : "/api/link-hub/categories"
                    : isEdit
                    ? `/api/link-hub/links/${data?.id}`
                    : "/api/link-hub/links";

            const method = isEdit ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                onSave();
            } else {
                alert(result.error || "저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("저장 오류:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {type === "category"
                            ? isEdit
                                ? "카테고리 편집"
                                : "카테고리 추가"
                            : isEdit
                            ? "링크 편집"
                            : "링크 추가"}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {type === "category" ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    카테고리 이름 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.name
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="예: 협업툴"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    정렬 순서
                                </label>
                                <input
                                    type="number"
                                    value={formData.display_order || 0}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "display_order",
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    카테고리 *
                                </label>
                                <select
                                    value={formData.category_id || ""}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "category_id",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.category_id
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <option value="">카테고리 선택</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.category_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    링크 제목 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title || ""}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.title
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    value={formData.url || ""}
                                    onChange={(e) =>
                                        handleInputChange("url", e.target.value)
                                    }
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.url
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="https://example.com"
                                />
                                {errors.url && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.url}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    정렬 순서
                                </label>
                                <input
                                    type="number"
                                    value={formData.display_order || 0}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "display_order",
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                        </>
                    )}

                    {/* 버튼 */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
