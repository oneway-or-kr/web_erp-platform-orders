// ESM (G마켓 · 옥션) 플랫폼 엑셀 파일 파싱
import * as XLSX from "xlsx";
import { StandardOrderData, FileUtils } from "../utils";

// ESM 파서는 표준 인터페이스를 그대로 사용

export class ESMParser {
    /**
     * ESM 엑셀 파일을 표준 형식으로 변환
     * @param file ESM 엑셀 파일
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

            return rows.map((row, index) => {
                // A열 값으로 플랫폼 구분 (실제 데이터 행 번호는 headerRowIndex + index + 1)
                const platform = this.detectESMPlatform(
                    sheet,
                    headerRowIndex + index + 1
                );
                return this.mapRowToStandardData(row, platform);
            });
        } catch (error) {
            throw new Error(`ESM 파일 파싱 실패: ${error}`);
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
                "주문번호",
                "구매자명",
                "주문일",
                "수령인명",
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
     * A열 값을 확인하여 옥션/지마켓 구분
     * @param sheet XLSX 시트 객체
     * @param rowIndex 확인할 행 번호 (0-based)
     * @returns "옥션", "지마켓", 또는 "ESM"
     */
    private static detectESMPlatform(
        sheet: XLSX.WorkSheet,
        rowIndex: number
    ): string {
        try {
            // A열 (0번째 열)의 해당 행 셀 값 확인
            const cellAddress = XLSX.utils.encode_cell({ c: 0, r: rowIndex });
            const cell = sheet[cellAddress];

            if (cell && cell.v) {
                const cellValue = String(cell.v).trim();

                // "옥션"으로 시작하는지 확인
                if (cellValue.startsWith("옥션")) {
                    return "옥션";
                }

                // "지마켓"으로 시작하는지 확인
                if (cellValue.startsWith("지마켓")) {
                    return "지마켓";
                }
            }

            // 기본값은 ESM
            return "ESM";
        } catch (error) {
            console.error("ESM 플랫폼 구분 중 오류:", error);
            return "ESM";
        }
    }

    /**
     * ESM 행 데이터를 표준 데이터로 변환
     * @param row ESM 엑셀 행 데이터
     * @param platform 감지된 플랫폼 ("옥션", "지마켓", "ESM")
     * @returns 표준화된 주문 데이터
     */
    private static mapRowToStandardData(
        row: Record<string, string | number>,
        platform: string
    ): StandardOrderData {
        return {
            order_number: String(row["주문번호"] || ""),
            order_name: String(row["상품명"] || ""), // 주문명으로 상품명 사용
            order_date: FileUtils.parseESMDate(row["주문일(결제확인전)"]),
            receiver_name: String(row["수령인명"] || ""),
            receiver_phone: FileUtils.formatPhone(row["수령인 휴대폰"]),
            receiver_post: FileUtils.padZip(row["우편번호"]),
            receiver_address: String(row["주소"] || ""),
            product_name: String(row["상품명"] || ""),
            option_name: String(row["옵션"] || ""),
            quantity: Number(row["수량"]) || 0,
            final_price: FileUtils.parsePrice(row["판매금액"]),
            platform: platform, // 동적으로 감지된 플랫폼
            order_phone: FileUtils.formatPhone(row["구매자 휴대폰"]),
        };
    }

    /**
     * ESM 파일 검증
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
                errors.push(`${index + 1}행: 주문번호가 누락되었습니다.`);
            }
            if (!item.product_name) {
                errors.push(`${index + 1}행: 상품명이 누락되었습니다.`);
            }
            if (!item.receiver_name) {
                errors.push(`${index + 1}행: 수령인명이 누락되었습니다.`);
            }
        });

        // 플랫폼 구분 통계
        const platformCounts = data.reduce((acc, item) => {
            acc[item.platform] = (acc[item.platform] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log("ESM 플랫폼 구분 결과:", platformCounts);

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
