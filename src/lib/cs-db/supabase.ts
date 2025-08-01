/**
 * Supabase 연동 관련 함수들 (새로운 CS 테이블 스키마 기반)
 */

import { createClient } from "@supabase/supabase-js";
import {
    CSTicket,
    CreateTicketInput,
    UpdateTicketInput,
    TicketFilters,
    PaginatedResponse,
    TicketStatus,
} from "./types";

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 새로운 CS 티켓 생성
 */
export async function createTicket(
    input: CreateTicketInput
): Promise<CSTicket> {
    try {
        const ticketData = {
            conv_id: input.conv_id,
            client_name: input.client_name,
            client_phone: input.client_phone,
            order_number: input.order_number,
            received_date: input.received_date,
            receiver_name: input.receiver_name,
            receiver_phone: input.receiver_phone,
            platform: input.platform,
            tags: input.tags || null,
            return_tracknum: input.return_tracknum || null,
            status: input.status || "접수",
            conv_channel: input.conv_channel,
        };

        const { data, error } = await supabase
            .from("cs")
            .insert([ticketData])
            .select()
            .single();

        if (error) {
            console.error("티켓 생성 중 Supabase 오류:", error);
            throw new Error("티켓 생성에 실패했습니다.");
        }

        return mapSupabaseToTicket(data);
    } catch (error) {
        console.error("티켓 생성 중 오류:", error);
        throw error;
    }
}

/**
 * 대화 ID로 특정 티켓 조회
 */
export async function getTicketById(convId: string): Promise<CSTicket | null> {
    try {
        const { data, error } = await supabase
            .from("cs")
            .select("*")
            .eq("conv_id", convId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null; // 데이터 없음
            }
            console.error("티켓 조회 중 Supabase 오류:", error);
            throw new Error("티켓 조회에 실패했습니다.");
        }

        return mapSupabaseToTicket(data);
    } catch (error) {
        console.error("티켓 조회 중 오류:", error);
        throw error;
    }
}

/**
 * 주문번호로 티켓 조회
 */
export async function getTicketByOrderNumber(
    orderNumber: string
): Promise<CSTicket | null> {
    try {
        const { data, error } = await supabase
            .from("cs")
            .select("*")
            .eq("order_number", orderNumber)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null; // 데이터 없음
            }
            console.error("티켓 조회 중 Supabase 오류:", error);
            throw new Error("티켓 조회에 실패했습니다.");
        }

        return mapSupabaseToTicket(data);
    } catch (error) {
        console.error("티켓 조회 중 오류:", error);
        throw error;
    }
}

/**
 * 티켓 목록 조회 (페이징 및 필터링 지원)
 */
export async function getTickets(
    filters: TicketFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = "received_date",
    sortOrder: "asc" | "desc" = "desc"
): Promise<PaginatedResponse<CSTicket>> {
    try {
        let query = supabase.from("cs").select("*", { count: "exact" });

        // 필터 적용
        if (filters.status) {
            query = query.eq("status", filters.status);
        }
        if (filters.platform) {
            query = query.eq("platform", filters.platform);
        }
        if (filters.conv_channel) {
            query = query.eq("conv_channel", filters.conv_channel);
        }
        if (filters.client_name) {
            query = query.ilike("client_name", `%${filters.client_name}%`);
        }
        if (filters.order_number) {
            query = query.ilike("order_number", `%${filters.order_number}%`);
        }
        if (filters.received_after) {
            query = query.gte("received_date", filters.received_after);
        }
        if (filters.received_before) {
            query = query.lte("received_date", filters.received_before);
        }
        if (filters.search) {
            query = query.or(
                `client_name.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%,receiver_name.ilike.%${filters.search}%`
            );
        }
        if (filters.tags && filters.tags.length > 0) {
            query = query.overlaps("tags", filters.tags);
        }

        // 정렬 및 페이징
        const offset = (page - 1) * limit;
        query = query
            .order(sortBy, { ascending: sortOrder === "asc" })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("티켓 목록 조회 중 Supabase 오류:", error);
            throw new Error("티켓 목록 조회에 실패했습니다.");
        }

        const tickets = data?.map(mapSupabaseToTicket) || [];
        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            tickets,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    } catch (error) {
        console.error("티켓 목록 조회 중 오류:", error);
        throw error;
    }
}

/**
 * 티켓 정보 업데이트
 */
export async function updateTicket(
    convId: string,
    input: UpdateTicketInput
): Promise<CSTicket> {
    try {
        const updateData = {
            ...input,
        };

        const { data, error } = await supabase
            .from("cs")
            .update(updateData)
            .eq("conv_id", convId)
            .select()
            .single();

        if (error) {
            console.error("티켓 업데이트 중 Supabase 오류:", error);
            throw new Error("티켓 업데이트에 실패했습니다.");
        }

        return mapSupabaseToTicket(data);
    } catch (error) {
        console.error("티켓 업데이트 중 오류:", error);
        throw error;
    }
}

/**
 * 티켓 삭제
 */
export async function deleteTicket(convId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("cs")
            .delete()
            .eq("conv_id", convId);

        if (error) {
            console.error("티켓 삭제 중 Supabase 오류:", error);
            throw new Error("티켓 삭제에 실패했습니다.");
        }

        return true;
    } catch (error) {
        console.error("티켓 삭제 중 오류:", error);
        throw error;
    }
}

/**
 * 티켓 Upsert (업데이트 또는 생성)
 * 기존 티켓이 있으면 업데이트, 없으면 새로 생성
 */
export async function upsertTicket(
    input: CreateTicketInput
): Promise<CSTicket> {
    try {
        // 기존 티켓 존재 여부 확인
        const existingTicket = await getTicketById(input.conv_id);

        if (existingTicket) {
            // 기존 티켓이 있는 경우 업데이트
            console.log("기존 티켓 업데이트:", input.conv_id);

            const updateData = {
                client_name: input.client_name,
                client_phone: input.client_phone,
                order_number: input.order_number,
                received_date: input.received_date,
                receiver_name: input.receiver_name,
                receiver_phone: input.receiver_phone,
                platform: input.platform,
                tags: input.tags,
                return_tracknum: input.return_tracknum,
                conv_channel: input.conv_channel,
                // 상태는 기존 상태 유지 (업데이트하지 않음)
            };

            return await updateTicket(input.conv_id, updateData);
        } else {
            // 새로운 티켓 생성
            console.log("새 티켓 생성:", input.conv_id);
            return await createTicket(input);
        }
    } catch (error) {
        console.error("티켓 Upsert 중 오류:", error);
        throw error;
    }
}

/**
 * Supabase 데이터를 CSTicket 타입으로 변환
 */
function mapSupabaseToTicket(data: Record<string, unknown>): CSTicket {
    return {
        conv_id: data.conv_id as string,
        client_name: data.client_name as string,
        client_phone: data.client_phone as string,
        order_number: data.order_number as string,
        received_date: data.received_date as string,
        receiver_name: data.receiver_name as string,
        receiver_phone: data.receiver_phone as string,
        platform: data.platform as string,
        tags: data.tags as string[],
        return_tracknum: data.return_tracknum as string | null,
        status: data.status as TicketStatus,
        conv_channel: data.conv_channel as string,
        created_at: data.created_at as string,
        updated_at: data.updated_at as string,
    };
}

/**
 * 새로운 CS 테이블 스키마 (참고용)
 */
export const CS_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS cs (
  conv_id UUID PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  order_number TEXT NOT NULL,
  received_date DATE NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  platform TEXT NOT NULL,
  tags JSON,
  return_tracknum TEXT,
  status TEXT NOT NULL CHECK (status IN ('접수', '처리중', '보류', '완료', '취소')),
  conv_channel TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cs_conv_id ON cs(conv_id);
CREATE INDEX IF NOT EXISTS idx_cs_order_number ON cs(order_number);
CREATE INDEX IF NOT EXISTS idx_cs_client_name ON cs(client_name);
CREATE INDEX IF NOT EXISTS idx_cs_status ON cs(status);
CREATE INDEX IF NOT EXISTS idx_cs_platform ON cs(platform);
CREATE INDEX IF NOT EXISTS idx_cs_received_date ON cs(received_date);
CREATE INDEX IF NOT EXISTS idx_cs_conv_channel ON cs(conv_channel);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cs_updated_at BEFORE UPDATE ON cs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
