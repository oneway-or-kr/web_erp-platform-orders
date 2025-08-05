"use client";

import { useState, useEffect } from "react";
import { LinkCategory, LinkItem, LinkHubData } from "@/lib/link-hub/types";
import DashboardLinkCategorySection from "./DashboardLinkCategorySection";
import LinkEditModal from "./LinkEditModal";
import { PlusCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function DashboardLinkHub() {
    const [data, setData] = useState<LinkHubData>({
        categories: [],
        links: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<{
        type: "category" | "link";
        data?: LinkCategory | LinkItem;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/link-hub");
            const result = await response.json();

            if (result.success && result.data) {
                // 데이터 안전성 검사
                const safeData = {
                    categories: Array.isArray(result.data.categories)
                        ? result.data.categories
                        : [],
                    links: Array.isArray(result.data.links)
                        ? result.data.links
                        : [],
                };
                setData(safeData);
            } else {
                setError(result.error || "데이터 로드에 실패했습니다.");
            }
        } catch (error) {
            console.error("데이터 로드 오류:", error);
            setError("데이터 로드 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditCategory = (category: LinkCategory) => {
        setEditingItem({ type: "category", data: category });
        setShowEditModal(true);
    };

    const handleEditLink = (link: LinkItem) => {
        setEditingItem({ type: "link", data: link });
        setShowEditModal(true);
    };

    const handleAddCategory = () => {
        setEditingItem({ type: "category" });
        setShowEditModal(true);
    };

    const handleAddLink = (categoryId: string) => {
        setEditingItem({
            type: "link",
            data: { category_id: categoryId } as LinkItem,
        });
        setShowEditModal(true);
    };

    const handleSave = async () => {
        setShowEditModal(false);
        setEditingItem(null);
        await loadData();
    };

    const handleDelete = async (type: "category" | "link", id: string) => {
        try {
            const endpoint =
                type === "category"
                    ? `/api/link-hub/categories/${id}`
                    : `/api/link-hub/links/${id}`;

            const response = await fetch(endpoint, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                await loadData();
            } else {
                alert(result.error || "삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("삭제 오류:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">링크허브 로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 편집 모드 토글 */}
            <div className="flex justify-end">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isEditMode
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                    >
                        <Cog6ToothIcon className="w-4 h-4 mr-2" />
                        {isEditMode ? "편집 종료" : "편집 모드"}
                    </button>
                    {isEditMode && (
                        <button
                            onClick={handleAddCategory}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                            <PlusCircleIcon className="w-4 h-4 mr-2" />
                            카테고리 추가
                        </button>
                    )}
                </div>
            </div>

            {/* 카테고리 목록 - 한 줄에 하나씩 가로로 배치 */}
            <div className="space-y-2">
                {data.categories && data.categories.length > 0 ? (
                    data.categories.map((category) => {
                        // 카테고리 유효성 검사
                        if (!category || !category.id || !category.name) {
                            return null;
                        }

                        return (
                            <DashboardLinkCategorySection
                                key={category.id}
                                category={category}
                                links={
                                    data.links
                                        ? data.links.filter(
                                              (link) =>
                                                  link &&
                                                  link.category_id ===
                                                      category.id
                                          )
                                        : []
                                }
                                isEditMode={isEditMode}
                                onEditCategory={handleEditCategory}
                                onEditLink={handleEditLink}
                                onAddLink={handleAddLink}
                                onDeleteCategory={handleDelete}
                                onDeleteLink={handleDelete}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                            등록된 카테고리가 없습니다.
                        </p>
                        <button
                            onClick={handleAddCategory}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                            <PlusCircleIcon className="w-4 h-4 mr-2" />첫 번째
                            카테고리 추가하기
                        </button>
                    </div>
                )}
            </div>

            {/* 편집 모달 */}
            {showEditModal && editingItem && (
                <LinkEditModal
                    type={editingItem.type}
                    data={editingItem.data}
                    categories={data.categories}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowEditModal(false);
                        setEditingItem(null);
                    }}
                />
            )}
        </div>
    );
}
