/**
 * 링크허브 수파베이스 연동 함수들
 */

import { createClient } from "@supabase/supabase-js";
import {
    LinkCategory,
    LinkItem,
    CreateCategoryInput,
    UpdateCategoryInput,
    CreateLinkInput,
    UpdateLinkInput,
    LinkHubData,
} from "./types";

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 카테고리 관련 함수들
 */

// 모든 카테고리 조회
export async function getCategories(): Promise<LinkCategory[]> {
    try {
        const { data, error } = await supabase
            .from("link_categories")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error("카테고리 조회 중 오류:", error);
            throw new Error("카테고리 조회에 실패했습니다.");
        }

        return data || [];
    } catch (error) {
        console.error("카테고리 조회 중 오류:", error);
        throw error;
    }
}

// 카테고리 생성
export async function createCategory(
    input: CreateCategoryInput
): Promise<LinkCategory> {
    try {
        const { data, error } = await supabase
            .from("link_categories")
            .insert([
                {
                    name: input.name,
                    display_order: input.display_order || 0,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("카테고리 생성 중 오류:", error);
            throw new Error("카테고리 생성에 실패했습니다.");
        }

        return data;
    } catch (error) {
        console.error("카테고리 생성 중 오류:", error);
        throw error;
    }
}

// 카테고리 업데이트
export async function updateCategory(
    id: string,
    input: UpdateCategoryInput
): Promise<LinkCategory> {
    try {
        const { data, error } = await supabase
            .from("link_categories")
            .update(input)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("카테고리 업데이트 중 오류:", error);
            throw new Error("카테고리 업데이트에 실패했습니다.");
        }

        return data;
    } catch (error) {
        console.error("카테고리 업데이트 중 오류:", error);
        throw error;
    }
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("link_categories")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("카테고리 삭제 중 오류:", error);
            throw new Error("카테고리 삭제에 실패했습니다.");
        }

        return true;
    } catch (error) {
        console.error("카테고리 삭제 중 오류:", error);
        throw error;
    }
}

/**
 * 링크 아이템 관련 함수들
 */

// 모든 링크 조회 (카테고리 정보 포함)
export async function getLinks(): Promise<LinkItem[]> {
    try {
        const { data, error } = await supabase
            .from("link_items")
            .select(
                `
                *,
                category:link_categories(*)
            `
            )
            .order("display_order", { ascending: true });

        if (error) {
            console.error("링크 조회 중 오류:", error);
            throw new Error("링크 조회에 실패했습니다.");
        }

        return data || [];
    } catch (error) {
        console.error("링크 조회 중 오류:", error);
        throw error;
    }
}

// 특정 카테고리의 링크들만 조회
export async function getLinksByCategory(
    categoryId: string
): Promise<LinkItem[]> {
    try {
        const { data, error } = await supabase
            .from("link_items")
            .select(
                `
                *,
                category:link_categories(*)
            `
            )
            .eq("category_id", categoryId)
            .order("display_order", { ascending: true });

        if (error) {
            console.error("카테고리별 링크 조회 중 오류:", error);
            throw new Error("카테고리별 링크 조회에 실패했습니다.");
        }

        return data || [];
    } catch (error) {
        console.error("카테고리별 링크 조회 중 오류:", error);
        throw error;
    }
}

// 링크 생성
export async function createLink(input: CreateLinkInput): Promise<LinkItem> {
    try {
        const { data, error } = await supabase
            .from("link_items")
            .insert([
                {
                    category_id: input.category_id,
                    title: input.title,
                    url: input.url,
                    icon_url: input.icon_url || null,
                    description: input.description || null,
                    display_order: input.display_order || 0,
                },
            ])
            .select(
                `
                *,
                category:link_categories(*)
            `
            )
            .single();

        if (error) {
            console.error("링크 생성 중 오류:", error);
            throw new Error("링크 생성에 실패했습니다.");
        }

        return data;
    } catch (error) {
        console.error("링크 생성 중 오류:", error);
        throw error;
    }
}

// 링크 업데이트
export async function updateLink(
    id: string,
    input: UpdateLinkInput
): Promise<LinkItem> {
    try {
        const { data, error } = await supabase
            .from("link_items")
            .update(input)
            .eq("id", id)
            .select(
                `
                *,
                category:link_categories(*)
            `
            )
            .single();

        if (error) {
            console.error("링크 업데이트 중 오류:", error);
            throw new Error("링크 업데이트에 실패했습니다.");
        }

        return data;
    } catch (error) {
        console.error("링크 업데이트 중 오류:", error);
        throw error;
    }
}

// 링크 삭제
export async function deleteLink(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("link_items")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("링크 삭제 중 오류:", error);
            throw new Error("링크 삭제에 실패했습니다.");
        }

        return true;
    } catch (error) {
        console.error("링크 삭제 중 오류:", error);
        throw error;
    }
}

// 전체 링크허브 데이터 조회 (카테고리 + 링크)
export async function getLinkHubData(): Promise<LinkHubData> {
    try {
        const [categories, links] = await Promise.all([
            getCategories(),
            getLinks(),
        ]);

        return {
            categories,
            links,
        };
    } catch (error) {
        console.error("링크허브 데이터 조회 중 오류:", error);
        throw error;
    }
}

/**
 * 테이블 스키마 (수파베이스에서 실행)
 */
export const LINK_HUB_TABLE_SCHEMA = `
-- 링크 카테고리 테이블
CREATE TABLE IF NOT EXISTS link_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 링크 아이템 테이블
CREATE TABLE IF NOT EXISTS link_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES link_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_link_categories_display_order ON link_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_link_items_category_id ON link_items(category_id);
CREATE INDEX IF NOT EXISTS idx_link_items_display_order ON link_items(display_order);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_link_categories_updated_at BEFORE UPDATE ON link_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_items_updated_at BEFORE UPDATE ON link_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 카테고리 데이터 삽입
INSERT INTO link_categories (name, display_order) VALUES
  ('협업툴', 1),
  ('플랫폼', 2),
  ('오퍼레이션', 3),
  ('마케팅', 4)
ON CONFLICT (name) DO NOTHING;
`;
