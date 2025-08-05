/**
 * 링크허브 관련 타입 정의
 */

export interface LinkCategory {
    id: string;
    name: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface LinkItem {
    id: string;
    category_id: string;
    title: string;
    url: string;
    icon_url?: string | null;
    description?: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
    category?: LinkCategory; // JOIN 시 사용
}

export interface CreateCategoryInput {
    name: string;
    display_order?: number;
}

export interface UpdateCategoryInput {
    name?: string;
    display_order?: number;
}

export interface CreateLinkInput {
    category_id: string;
    title: string;
    url: string;
    icon_url?: string;
    description?: string;
    display_order?: number;
}

export interface UpdateLinkInput {
    title?: string;
    url?: string;
    icon_url?: string;
    description?: string;
    display_order?: number;
    category_id?: string;
}

export interface LinkHubData {
    categories: LinkCategory[];
    links: LinkItem[];
}
