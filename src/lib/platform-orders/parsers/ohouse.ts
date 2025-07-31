// 오늘의집 플랫폼 엑셀 파일 파싱
import * as XLSX from "xlsx";
import { StandardOrderData, FileUtils } from "../utils";

// 오늘의집 파서는 표준 인터페이스를 그대로 사용

export class OhouseParser {
    /**
     * 오늘의집 엑셀 파일을 표준 형식으로 변환
     * @param file 오늘의집 엑셀 파일
     * @returns 표준화된 주문 데이터 배열
     */
    static async parse(file: File): Promise<StandardOrderData[]> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // 1행과 2행을 확인하여 헤더 행 감지
            const headerRowIndex = this.detectHeaderRow(sheet);

            // 감지된 헤더 행부터 데이터를 읽어옴
            const rows = XLSX.utils.sheet_to_json(sheet, {
                defval: "",
                range: headerRowIndex, // 감지된 헤더 행부터 시작
            }) as Array<Record<string, string | number>>;

            return rows.map((row) => this.mapRowToStandardData(row));
        } catch (error) {
            throw new Error(`오늘의집 파일 파싱 실패: ${error}`);
        }
    }

    /**
     * 헤더 행 감지 (1행 또는 2행)
     * @param sheet 엑셀 시트
     * @returns 헤더 행 인덱스 (0-based)
     */
    private static detectHeaderRow(sheet: XLSX.WorkSheet): number {
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

        // 1행과 2행의 내용을 확인
        const checkHeaders = (rowIndex: number): boolean => {
            const requiredHeaders = [
                "주문상품번호",
                "주문자명",
                "주문결제완료일",
                "수취인명",
                "상품명",
            ];
            let foundHeaders = 0;

            for (
                let col = range.s.c;
                col <= range.e.c && col < range.s.c + 20;
                col++
            ) {
                const cellAddress = XLSX.utils.encode_cell({
                    c: col,
                    r: rowIndex,
                });
                const cell = sheet[cellAddress];

                if (cell && cell.v) {
                    const cellValue = String(cell.v);
                    if (
                        requiredHeaders.some((header) =>
                            cellValue.includes(header)
                        )
                    ) {
                        foundHeaders++;
                    }
                }
            }

            return foundHeaders >= 3; // 최소 3개 이상의 필수 헤더가 있어야 함
        };

        // 1행부터 확인 (0-based index)
        if (checkHeaders(0)) {
            return 0;
        }
        // 2행 확인 (0-based index 1)
        if (checkHeaders(1)) {
            return 1;
        }

        // 기본값은 1행 (0-based index 0)
        return 0;
    }

    /**
     * 오늘의집 행 데이터를 표준 데이터로 변환
     * @param row 오늘의집 엑셀 행 데이터
     * @returns 표준화된 주문 데이터
     */
    private static mapRowToStandardData(
        row: Record<string, string | number>
    ): StandardOrderData {
        return {
            order_number: String(row["주문상품번호"] || ""),
            order_name: String(row["상품명"] || ""), // 주문명으로 상품명 사용
            order_date: this.parseOhouseDate(row["주문결제완료일"]),
            receiver_name: String(row["수취인명"] || ""),
            receiver_phone: FileUtils.formatPhone(row["수취인 연락처"]),
            receiver_post: FileUtils.padZip(row["수취인 우편번호"]),
            receiver_address: String(row["수취인 주소"] || ""),
            product_name: String(row["상품명"] || ""),
            option_name: String(row["옵션명"] || ""),
            quantity: Number(row["수량"]) || 0,
            final_price: FileUtils.parsePrice(
                row["판매가*수량 + 조립비 + 배송비"]
            ),
            platform: "오늘의집",
            order_phone: FileUtils.formatPhone(row["수취인 연락처"]), // 오늘의집은 주문자 연락처가 별도로 없음
        };
    }

    /**
     * 오늘의집 날짜 형식 파싱
     * @param dateStr 날짜 문자열
     * @returns YYYY-MM-DD 형식 날짜
     */
    private static parseOhouseDate(dateStr: string | number): string {
        if (!dateStr) return "";

        try {
            const str = String(dateStr).trim();

            // 오늘의집 형식: "2025.7.18  12:42:43 PM" 또는 "2025.7.18"
            const match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
            if (match) {
                const year = match[1];
                const month = match[2].padStart(2, "0");
                const day = match[3].padStart(2, "0");
                return `${year}-${month}-${day}`;
            }

            // 기본 Date 파싱 시도
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
        } catch (error) {
            console.error("날짜 파싱 오류:", error);
            return "";
        }
    }

    /**
     * 오늘의집 파일 검증
     * @param data 파싱된 데이터
     * @returns 검증 결과
     */
    static validate(data: StandardOrderData[]): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (data.length === 0) {
            errors.push("데이터가 없습니다.");
        }

        // 필수 필드 검증
        data.forEach((item, index) => {
            if (!item.order_number) {
                errors.push(`${index + 1}행: 주문상품번호가 누락되었습니다.`);
            }
            if (!item.product_name) {
                errors.push(`${index + 1}행: 상품명이 누락되었습니다.`);
            }
            if (!item.receiver_name) {
                errors.push(`${index + 1}행: 수취인명이 누락되었습니다.`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
