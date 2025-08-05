"use client";

import { LinkCategory, LinkItem } from "@/lib/link-hub/types";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface DashboardLinkCategorySectionProps {
    category: LinkCategory;
    links: LinkItem[];
    isEditMode: boolean;
    onEditCategory: (category: LinkCategory) => void;
    onEditLink: (link: LinkItem) => void;
    onAddLink: (categoryId: string) => void;
    onDeleteCategory: (type: "category", id: string) => void;
    onDeleteLink: (type: "link", id: string) => void;
}

export default function DashboardLinkCategorySection({
    category,
    links,
    isEditMode,
    onEditCategory,
    onEditLink,
    onAddLink,
    onDeleteCategory,
    onDeleteLink,
}: DashboardLinkCategorySectionProps) {
    // category가 없으면 렌더링하지 않음
    if (!category || !category.id || !category.name) {
        return null;
    }

    const handleLinkClick = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // URL에서 도메인 추출
    const getDomainFromUrl = (url: string) => {
        try {
            const urlObj = new URL(
                url.startsWith("http") ? url : `https://${url}`
            );
            return urlObj.hostname;
        } catch {
            return null;
        }
    };

    // favicon URL 생성
    const getFaviconUrl = (url: string) => {
        const domain = getDomainFromUrl(url);
        return domain
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
            : null;
    };

    // 제목 글자수 제한 (10글자)
    const truncateTitle = (title: string, maxLength = 10) => {
        return title.length > maxLength
            ? title.substring(0, maxLength) + "..."
            : title;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-3">
                {/* 카테고리 제목 - 왼쪽 고정 너비 */}
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                        {category.name}
                    </h3>
                    {isEditMode && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => onEditCategory(category)}
                                className="p-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                title="카테고리 편집"
                            >
                                <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => {
                                    if (links.length > 0) {
                                        alert(
                                            "카테고리에 링크가 있어서 삭제할 수 없습니다. 먼저 모든 링크를 삭제해주세요."
                                        );
                                        return;
                                    }
                                    if (
                                        confirm(
                                            "정말 이 카테고리를 삭제하시겠습니까?"
                                        )
                                    ) {
                                        onDeleteCategory(
                                            "category",
                                            category.id
                                        );
                                    }
                                }}
                                className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                title="카테고리 삭제"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* 링크 목록 - 수평 배치 */}
                <div className="flex-1 min-w-0">
                    {links.length === 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">
                                링크 없음
                            </span>
                            {isEditMode && (
                                <button
                                    onClick={() => onAddLink(category.id)}
                                    className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs transition-colors"
                                    title="링크 추가"
                                >
                                    <PlusIcon className="w-3 h-3 mr-1" />
                                    추가
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {links.map((link) => (
                                <div
                                    key={link.id}
                                    className="group flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all cursor-pointer flex-shrink-0"
                                    onClick={() =>
                                        !isEditMode && handleLinkClick(link.url)
                                    }
                                >
                                    {/* 아이콘 */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={
                                                link.icon_url ||
                                                getFaviconUrl(link.url) ||
                                                ""
                                            }
                                            alt={link.title}
                                            className="w-4 h-4 rounded"
                                            onError={(e) => {
                                                // favicon 로드 실패시 기본 아이콘 표시
                                                e.currentTarget.style.display =
                                                    "none";
                                                const fallback = e.currentTarget
                                                    .nextElementSibling as HTMLElement;
                                                if (fallback)
                                                    fallback.style.display =
                                                        "inline";
                                            }}
                                        />
                                        <span
                                            className="text-blue-600 text-xs hidden"
                                            style={{ display: "none" }}
                                        >
                                            🔗
                                        </span>
                                    </div>

                                    {/* 제목 - 10글자 제한 */}
                                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                        {truncateTitle(link.title)}
                                    </span>

                                    {/* 편집 모드 액션 */}
                                    {isEditMode && (
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditLink(link);
                                                }}
                                                className="p-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                                title="링크 편집"
                                            >
                                                <PencilIcon className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (
                                                        confirm(
                                                            "정말 이 링크를 삭제하시겠습니까?"
                                                        )
                                                    ) {
                                                        onDeleteLink(
                                                            "link",
                                                            link.id
                                                        );
                                                    }
                                                }}
                                                className="p-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                title="링크 삭제"
                                            >
                                                <TrashIcon className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* 편집 모드에서 링크 추가 버튼 */}
                            {isEditMode && (
                                <button
                                    onClick={() => onAddLink(category.id)}
                                    className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs transition-colors flex-shrink-0"
                                    title="링크 추가"
                                >
                                    <PlusIcon className="w-3 h-3 mr-1" />
                                    추가
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
