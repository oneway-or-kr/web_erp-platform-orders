// 리뷰 문자 발송용 데이터 처리기
import {
    OrderData,
    ReturnExchangeData,
    CSSpreadsheetData,
    FilteringResult,
} from "./types";
import { GoogleSheetsService } from "./google-sheets";

export class ReviewSmsDataProcessor {
    /**
     * 주문 데이터에서 반품/교환/CS 건을 제외하여 최종 리스트 생성
     * @param orders 원본 주문 데이터
     * @param returns 반품 데이터
     * @param exchanges 교환 데이터
     * @param csData CS 스프레드시트 데이터
     * @returns 필터링 결과
     */
    static filterOrderData(
        orders: OrderData[],
        returns: ReturnExchangeData[] = [],
        exchanges: ReturnExchangeData[] = [],
        csData: CSSpreadsheetData[] = []
    ): FilteringResult {
        const originalCount = orders.length;

        // 제외할 주문번호+수취인명 조합을 Set으로 생성 (빠른 검색)
        const returnKeys = new Set(
            returns.map((item) => `${item.order_number}#${item.receiver_name}`)
        );
        const exchangeKeys = new Set(
            exchanges.map(
                (item) => `${item.order_number}#${item.receiver_name}`
            )
        );
        const csOrderNumbers = new Set(csData.map((item) => item.order_number));

        // 제외된 데이터 추적
        const removedData = {
            returns: [] as OrderData[],
            exchanges: [] as OrderData[],
            cs: [] as OrderData[],
        };

        // 최종 데이터 필터링
        const finalData = orders.filter((order) => {
            const orderKey = `${order.order_number}#${order.receiver_name}`;

            // 반품 건 제외
            if (returnKeys.has(orderKey)) {
                removedData.returns.push(order);
                return false;
            }

            // 교환 건 제외
            if (exchangeKeys.has(orderKey)) {
                removedData.exchanges.push(order);
                return false;
            }

            // CS 스프레드시트 주문번호 제외
            if (csOrderNumbers.has(order.order_number)) {
                removedData.cs.push(order);
                return false;
            }

            return true;
        });

        const finalCount = finalData.length;
        const removedCount = originalCount - finalCount;

        console.log("📊 데이터 필터링 결과:", {
            원본: originalCount,
            최종: finalCount,
            제외: removedCount,
            반품제외: removedData.returns.length,
            교환제외: removedData.exchanges.length,
            CS제외: removedData.cs.length,
        });

        return {
            originalCount,
            finalCount,
            removedCount,
            finalData,
            removedData,
        };
    }

    /**
     * 전체 프로세싱 실행 (구글 스프레드시트 데이터 포함)
     * @param orders 주문 데이터
     * @param returns 반품 데이터
     * @param exchanges 교환 데이터
     * @returns 필터링 결과
     */
    static async processWithGoogleSheets(
        orders: OrderData[],
        returns: ReturnExchangeData[] = [],
        exchanges: ReturnExchangeData[] = []
    ): Promise<FilteringResult & { csError?: string }> {
        try {
            // 구글 스프레드시트에서 CS 데이터 가져오기
            const csResult = await GoogleSheetsService.fetchCSData();

            if (!csResult.success) {
                // CS 데이터 가져오기 실패해도 나머지는 처리
                console.warn(
                    "⚠️ CS 데이터 가져오기 실패, CS 제외 없이 진행:",
                    csResult.error
                );
                const result = this.filterOrderData(
                    orders,
                    returns,
                    exchanges,
                    []
                );
                return {
                    ...result,
                    csError: csResult.error,
                };
            }

            // 정상적으로 CS 데이터까지 포함하여 필터링
            return this.filterOrderData(
                orders,
                returns,
                exchanges,
                csResult.data || []
            );
        } catch (error) {
            console.error("❌ 데이터 프로세싱 중 오류:", error);
            // 오류 발생 시 CS 제외 없이 처리
            const result = this.filterOrderData(orders, returns, exchanges, []);
            return {
                ...result,
                csError: `프로세싱 오류: ${error}`,
            };
        }
    }

    /**
     * 최종 데이터를 CSV 형식으로 변환
     * @param finalData 최종 주문 데이터
     * @returns CSV 문자열
     */
    static convertToCSV(finalData: OrderData[]): string {
        if (finalData.length === 0) return "";

        const headers = ["주문번호", "상품명", "수취인명", "수취인전화번호"];

        const csvContent = [
            headers.join(","),
            ...finalData.map((order) =>
                [
                    `"${order.order_number}"`,
                    `"${order.product_name}"`,
                    `"${order.receiver_name}"`,
                    `"${order.receiver_phone}"`,
                ].join(",")
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
        filename: string = "review_sms_list.csv"
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
}

