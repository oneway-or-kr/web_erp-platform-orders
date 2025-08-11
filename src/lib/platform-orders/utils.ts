// 공통 유틸 함수들
import * as XLSX from "xlsx";

export interface StandardOrderData {
    order_number: string;
    order_name: string; // 주문자명 (구매자명)
    order_date: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_post: string;
    receiver_address: string;
    product_name: string;
    option_name: string;
    quantity: number;
    final_price: number;
    platform: string;
    order_phone: string;
}

export class FileUtils {
    /**
     * 엑셀 파일을 읽어서 데이터 배열로 변환
     * @param file 엑셀 파일
     * @returns 2차원 배열 데이터
     */
    static async readExcelFile(file: File): Promise<(string | number)[][]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: "binary" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                    });
                    resolve(jsonData as (string | number)[][]);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("파일 읽기 실패"));
            reader.readAsBinaryString(file);
        });
    }

    /**
     * CSV 파일을 읽어서 데이터 배열로 변환
     * @param file CSV 파일
     * @returns 2차원 배열 데이터
     */
    static async readCSVFile(file: File): Promise<(string | number)[][]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    // CSV 파싱 (간단한 구현)
                    const lines = text.split("\n");
                    const result: (string | number)[][] = [];

                    for (const line of lines) {
                        if (line.trim()) {
                            // CSV 파싱: 따옴표로 감싸진 필드 처리
                            const fields: (string | number)[] = [];
                            let currentField = "";
                            let inQuotes = false;

                            for (let i = 0; i < line.length; i++) {
                                const char = line[i];
                                const nextChar = line[i + 1];

                                if (char === '"') {
                                    if (inQuotes && nextChar === '"') {
                                        // 이스케이프된 따옴표
                                        currentField += '"';
                                        i++; // 다음 따옴표 건너뛰기
                                    } else {
                                        // 따옴표 시작/끝
                                        inQuotes = !inQuotes;
                                    }
                                } else if (char === "," && !inQuotes) {
                                    // 필드 구분자
                                    const trimmed = currentField.trim();
                                    // 숫자인지 확인
                                    const num = Number(trimmed);
                                    fields.push(isNaN(num) ? trimmed : num);
                                    currentField = "";
                                } else {
                                    currentField += char;
                                }
                            }

                            // 마지막 필드 추가
                            const trimmed = currentField.trim();
                            const num = Number(trimmed);
                            fields.push(isNaN(num) ? trimmed : num);

                            result.push(fields);
                        }
                    }

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("CSV 파일 읽기 실패"));
            reader.readAsText(file, "utf-8");
        });
    }

    /**
     * 데이터를 CSV 형태로 변환
     * @param data 표준화된 주문 데이터 배열
     * @returns CSV 문자열
     */
    static convertToCSV(data: StandardOrderData[]): string {
        if (data.length === 0) return "";

        // API docs 순서에 맞게 헤더 순서 고정
        const headers = [
            "order_number",
            "order_name",
            "order_date",
            "receiver_name",
            "receiver_phone",
            "receiver_post",
            "receiver_address",
            "product_name",
            "option_name",
            "quantity",
            "final_price",
            "platform",
            "order_phone",
        ];

        const csvContent = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map(
                        (header) =>
                            `"${String(
                                row[header as keyof StandardOrderData] || ""
                            ).replace(/"/g, '""')}"`
                    )
                    .join(",")
            ),
        ].join("\n");

        return csvContent;
    }

    /**
     * CSV 파일 다운로드
     * @param csvContent CSV 문자열
     * @param filename 파일명
     */
    static downloadCSV(
        csvContent: string,
        filename: string = "integrated_orders.csv"
    ): void {
        // BOM(Byte Order Mark) 추가로 Excel에서 한글 깨짐 방지
        const BOM = "\uFEFF";
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 메모리 정리
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * 금액 문자열에서 숫자만 추출
     * @param str 금액 문자열 (예: "63,000원", "\63,000")
     * @returns 숫자로 변환된 금액
     */
    static parsePrice(str: string | number): number {
        return Number(String(str).replace(/[^\d]/g, "")) || 0;
    }

    /**
     * 기본 날짜 파싱: 시간 포함 데이터에서 날짜만 추출
     * @param raw 원본 날짜 데이터
     * @returns YYYY-MM-DD 형식의 날짜만 (시간 제거)
     */
    static parseDate(raw: string | Date | number): string {
        if (!raw) return "";

        const str = String(raw).trim();

        // 이미 YYYY-MM-DD 형식인 경우 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // 일반적인 날짜+시간 형식에서 날짜만 추출
        // "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DD"
        const dateTimeMatch = str.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/);
        if (dateTimeMatch) {
            return dateTimeMatch[1];
        }

        // "YYYY-MM-DDTHH:MM:SS" → "YYYY-MM-DD" (ISO 형식)
        const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})T/);
        if (isoMatch) {
            return isoMatch[1];
        }

        // 기본 Date 파싱 시도 (시간 제거)
        try {
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toISOString().slice(0, 10); // 시간 부분 제거
            }
        } catch (error) {
            console.log("날짜 파싱 오류:", str, error);
        }

        return "";
    }

    /**
     * 네이버 전용 날짜 파싱: Excel 사용자 지정 형식 처리 (yyyy.mm.dd hh:mm)
     * @param raw 네이버 날짜 데이터 (Excel 시리얼 번호 또는 문자열)
     * @returns YYYY-MM-DD 형식의 날짜만
     */
    static parseNaverDate(raw: string | number | Date): string {
        if (!raw) return "";

        // Excel 시리얼 번호인 경우 (숫자)
        if (typeof raw === "number") {
            try {
                // Excel 시리얼 날짜를 JavaScript Date로 변환
                const date = new Date((raw - 25569) * 86400 * 1000);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().slice(0, 10);
                }
            } catch (error) {
                // 개발 모드에서만 로그 출력
                if (process.env.NODE_ENV === "development") {
                    console.log("네이버 시리얼 번호 파싱 오류:", raw, error);
                }
            }
        }

        const str = String(raw).trim();

        // 이미 YYYY-MM-DD 형식인 경우 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // 네이버 형식: YYYY.M.D 패턴 찾기 (뒤에 시간이 있어도 상관없음)
        // 2025.7.21 또는 2025.07.21 형태를 찾고, 뒤에 뭐가 와도 무시
        const dateMatch = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, "0");
            const day = dateMatch[3].padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        // 네이버 날짜 파싱 실패 시 기본 파싱 시도
        return this.parseDate(raw);
    }

    /**
     * 쿠팡 전용 날짜 파싱: "2025-07-21 15:15:32" → "2025-07-21" (시간 제거)
     * @param raw 쿠팡 날짜 데이터
     * @returns YYYY-MM-DD 형식의 날짜만 (시간 제거)
     */
    static parseCoupangDate(raw: string | Date | number): string {
        if (!raw) return "";

        const str = String(raw).trim();

        // 이미 YYYY-MM-DD 형식인 경우 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // 쿠팡 형식: "2025-07-21 15:15:32" → "2025-07-21"
        const coupangDateTime = str.match(
            /^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}/
        );
        if (coupangDateTime) {
            return coupangDateTime[1];
        }

        // 쿠팡 날짜 형식들 처리
        try {
            // Excel 시리얼 번호로 저장된 날짜 처리
            if (/^\d+$/.test(str)) {
                const numDays = parseInt(str);
                if (numDays > 25000 && numDays < 50000) {
                    // 1968-2037 범위
                    const baseDate = new Date(1900, 0, 1);
                    baseDate.setDate(baseDate.getDate() + numDays - 2); // Excel의 1900년 윤년 버그 보정
                    return baseDate.toISOString().slice(0, 10);
                }
            }

            // 일반 날짜 문자열
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toISOString().slice(0, 10);
            }
        } catch (error) {
            console.log("쿠팡 날짜 파싱 오류:", str, error);
        }

        return "";
    }

    /**
     * 토스 전용 날짜 파싱: 이미 YYYY-MM-DD 형식
     * @param raw 토스 날짜 데이터
     * @returns YYYY-MM-DD 형식의 날짜 또는 null
     */
    static parseTossDate(raw: string | number | Date): string {
        if (!raw) return "";

        const str = String(raw).trim();

        // 토스는 이미 YYYY-MM-DD 형식
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // 기본 파싱 시도
        return this.parseDate(raw);
    }

    /**
     * ESM 전용 날짜 파싱: Excel 사용자 지정 형식 처리 (yyyy.mm.dd hh:mm)
     * @param raw ESM 날짜 데이터 (Excel 시리얼 번호 또는 문자열)
     * @returns YYYY-MM-DD 형식의 날짜만
     */
    static parseESMDate(raw: string | number | Date): string {
        if (!raw) return "";

        // Excel 시리얼 번호인 경우 (숫자)
        if (typeof raw === "number") {
            try {
                // Excel 시리얼 날짜를 JavaScript Date로 변환
                const date = new Date((raw - 25569) * 86400 * 1000);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().slice(0, 10);
                }
            } catch (error) {
                // 개발 모드에서만 로그 출력
                if (process.env.NODE_ENV === "development") {
                    console.log("ESM 시리얼 번호 파싱 오류:", raw, error);
                }
            }
        }

        const str = String(raw).trim();

        // 이미 YYYY-MM-DD 형식인 경우 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // ESM 형식: YYYY.M.D 패턴 찾기 (뒤에 시간이 있어도 상관없음)
        // 2025.7.21 또는 2025.07.21 형태를 찾고, 뒤에 뭐가 와도 무시
        const dateMatch = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, "0");
            const day = dateMatch[3].padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        // YYYY-MM-DD HH:MM:SS 형식에서 앞의 YYYY-MM-DD만 추출
        const datetimeMatch = str.match(
            /^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}/
        );
        if (datetimeMatch) {
            return datetimeMatch[1];
        }

        // YYYY-MM-DD TT:MM:SS 형식 (T가 있는 경우)
        const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})T/);
        if (isoMatch) {
            return isoMatch[1];
        }

        // Excel 시리얼 번호 처리
        if (/^\d+$/.test(str)) {
            const numDays = parseInt(str);
            if (numDays > 25000 && numDays < 50000) {
                const baseDate = new Date(1900, 0, 1);
                baseDate.setDate(baseDate.getDate() + numDays - 2);
                return baseDate.toISOString().slice(0, 10);
            }
        }

        // 기본 파싱 시도
        try {
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toISOString().slice(0, 10);
            }
        } catch (error) {
            console.log("ESM 날짜 파싱 오류:", str, error);
        }

        return "";
    }

    /**
     * 카페24 전용 날짜 파싱: 주문번호 앞 8자리를 YYYY-MM-DD로 변환
     * @param orderNumber 카페24 주문번호 (예: "20250121-0000001")
     * @returns YYYY-MM-DD 형식의 날짜
     */
    static parseCafe24Date(orderNumber: string): string {
        if (!orderNumber) return "";

        const str = String(orderNumber).trim();

        // 주문번호 앞 8자리 추출 (YYYYMMDD 형식)
        const dateString = str.substring(0, 8);

        // 8자리 숫자인지 확인
        if (!/^\d{8}$/.test(dateString)) {
            console.warn(
                `카페24 주문번호 형식이 올바르지 않습니다: ${orderNumber}`
            );
            return "";
        }

        // YYYYMMDD → YYYY-MM-DD 변환
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);

        return `${year}-${month}-${day}`;
    }

    /**
     * 우편번호 앞자리 0 패딩 (5자리로 맞춤)
     * @param val 우편번호
     * @returns 5자리로 패딩된 우편번호
     */
    static padZip(val: string | number): string {
        if (!val) return "";
        const str = String(val).trim();
        return str.padStart(5, "0");
    }

    /**
     * 전화번호 형식 정리 (하이픈 제거, 숫자만 추출)
     * @param phone 전화번호 (예: "010-1234-5678", "01012345678")
     * @returns 하이픈 없는 숫자만 포함된 전화번호
     */
    static formatPhone(phone: string | number): string {
        if (!phone) return "";
        const str = String(phone).trim();
        // 숫자만 추출 (하이픈, 공백, 괄호 등 모든 특수문자 제거)
        return str.replace(/[^\d]/g, "");
    }

    /**
     * 데이터 유효성 검증
     * @param data 표준화된 주문 데이터
     * @returns 유효성 검증 결과
     */
    static validateOrderData(data: StandardOrderData): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!data.order_number) errors.push("주문번호가 누락되었습니다.");
        if (!data.order_date) errors.push("주문일자가 누락되었습니다.");
        if (!data.product_name) errors.push("상품명이 누락되었습니다.");
        if (data.quantity <= 0) errors.push("수량이 올바르지 않습니다.");
        if (data.final_price <= 0) errors.push("총 금액이 올바르지 않습니다.");

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
