// 리뷰 문자 발송용 엑셀 파일 파서
import * as XLSX from "xlsx";
import { OrderData, ReturnExchangeData, ExcelProcessingResult } from "./types";

export class ReviewSmsExcelParser {
    /**
     * 파일명으로 파일 타입 자동 감지
     * @param fileName 파일명
     * @returns 파일 타입
     */
    static detectFileType(
        fileName: string
    ): "orders" | "returns" | "exchanges" | "unknown" {
        const lowerFileName = fileName.toLowerCase();

        if (lowerFileName.startsWith("deliverylist")) {
            return "orders";
        }
        if (lowerFileName.startsWith("returndelivery")) {
            return "returns";
        }
        if (lowerFileName.startsWith("exchange")) {
            return "exchanges";
        }

        return "unknown";
    }

    /**
     * 엑셀 파일을 읽어서 데이터 배열로 변환
     * @param file 엑셀 파일
     * @returns 2차원 배열 데이터
     */
    private static async readExcelFile(
        file: File
    ): Promise<(string | number)[][]> {
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
     * 주문 엑셀 파일 파싱 (DeliveryList)
     * @param file 주문 엑셀 파일
     * @returns 파싱 결과
     */
    static async parseOrdersFile(file: File): Promise<ExcelProcessingResult> {
        try {
            const rawData = await this.readExcelFile(file);

            if (rawData.length < 2) {
                return {
                    success: false,
                    errors: ["파일에 데이터가 없습니다."],
                    fileName: file.name,
                    fileType: "orders",
                };
            }

            const headers = rawData[0].map((h) => String(h).trim());

            // 필요한 컬럼 인덱스 찾기
            const orderNumberIndex = headers.findIndex((h) =>
                h.includes("주문번호")
            );
            const productNameIndex = headers.findIndex(
                (h) => h.includes("등록상품명") || h.includes("상품명")
            );
            const receiverNameIndex = headers.findIndex(
                (h) => h.includes("수취인이름") || h.includes("수취인명")
            );
            const receiverPhoneIndex = headers.findIndex(
                (h) => h.includes("수취인전화번호") || h.includes("전화번호")
            );

            // 필수 컬럼 확인
            const missingColumns = [];
            if (orderNumberIndex === -1) missingColumns.push("주문번호");
            if (productNameIndex === -1) missingColumns.push("등록상품명");
            if (receiverNameIndex === -1) missingColumns.push("수취인이름");
            if (receiverPhoneIndex === -1)
                missingColumns.push("수취인전화번호");

            if (missingColumns.length > 0) {
                return {
                    success: false,
                    errors: [
                        `필수 컬럼이 누락되었습니다: ${missingColumns.join(
                            ", "
                        )}`,
                    ],
                    fileName: file.name,
                    fileType: "orders",
                };
            }

            const orderData: OrderData[] = [];

            // 데이터 행 처리 (헤더 제외)
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const orderNumber = String(row[orderNumberIndex] || "").trim();
                const productName = String(row[productNameIndex] || "").trim();
                const receiverName = String(
                    row[receiverNameIndex] || ""
                ).trim();
                const receiverPhone = String(
                    row[receiverPhoneIndex] || ""
                ).trim();

                // 필수 데이터가 있는 경우만 추가
                if (orderNumber && receiverName && receiverPhone) {
                    orderData.push({
                        order_number: orderNumber,
                        product_name: productName,
                        receiver_name: receiverName,
                        receiver_phone: this.formatPhone(receiverPhone),
                    });
                }
            }

            return {
                success: true,
                data: orderData,
                fileName: file.name,
                fileType: "orders",
            };
        } catch (error) {
            return {
                success: false,
                errors: [`파일 파싱 실패: ${error}`],
                fileName: file.name,
                fileType: "orders",
            };
        }
    }

    /**
     * 반품/교환 엑셀 파일 파싱
     * @param file 반품/교환 엑셀 파일
     * @param fileType 파일 타입
     * @returns 파싱 결과
     */
    static async parseReturnExchangeFile(
        file: File,
        fileType: "returns" | "exchanges"
    ): Promise<ExcelProcessingResult> {
        try {
            const rawData = await this.readExcelFile(file);

            if (rawData.length < 2) {
                return {
                    success: false,
                    errors: ["파일에 데이터가 없습니다."],
                    fileName: file.name,
                    fileType,
                };
            }

            const headers = rawData[0].map((h) => String(h).trim());

            // 필요한 컬럼 인덱스 찾기
            const orderNumberIndex = headers.findIndex((h) =>
                h.includes("주문번호")
            );
            const receiverNameIndex = headers.findIndex(
                (h) =>
                    h.includes("수취인") ||
                    h.includes("수취인이름") ||
                    h.includes("수취인명") ||
                    h.includes("고객명")
            );

            // 필수 컬럼 확인
            const missingColumns = [];
            if (orderNumberIndex === -1) missingColumns.push("주문번호");
            if (receiverNameIndex === -1) missingColumns.push("수취인");

            if (missingColumns.length > 0) {
                return {
                    success: false,
                    errors: [
                        `필수 컬럼이 누락되었습니다: ${missingColumns.join(
                            ", "
                        )}`,
                    ],
                    fileName: file.name,
                    fileType,
                };
            }

            const returnExchangeData: ReturnExchangeData[] = [];

            // 데이터 행 처리 (헤더 제외)
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const orderNumber = String(row[orderNumberIndex] || "").trim();
                const receiverName = String(
                    row[receiverNameIndex] || ""
                ).trim();

                // 필수 데이터가 있는 경우만 추가
                if (orderNumber && receiverName) {
                    returnExchangeData.push({
                        order_number: orderNumber,
                        receiver_name: receiverName,
                    });
                }
            }

            return {
                success: true,
                data: returnExchangeData,
                fileName: file.name,
                fileType,
            };
        } catch (error) {
            return {
                success: false,
                errors: [`파일 파싱 실패: ${error}`],
                fileName: file.name,
                fileType,
            };
        }
    }

    /**
     * 전화번호 형식 정리 (하이픈 제거, 숫자만 추출)
     * @param phone 전화번호
     * @returns 정리된 전화번호
     */
    private static formatPhone(phone: string | number): string {
        if (!phone) return "";
        const str = String(phone).trim();
        // 숫자만 추출 (하이픈, 공백, 괄호 등 모든 특수문자 제거)
        return str.replace(/[^\d]/g, "");
    }
}
