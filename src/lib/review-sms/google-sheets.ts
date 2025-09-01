// 구글 스프레드시트 연동 유틸리티
import { CSSpreadsheetData } from "./types";

export class GoogleSheetsService {
    /**
     * 구글 스프레드시트에서 CS 데이터 가져오기
     * CSV로 변환된 구글 스프레드시트를 읽어온다
     * @param spreadsheetId 스프레드시트 ID
     * @param gid 시트 GID
     * @returns CS 데이터 배열
     */
    static async fetchCSData(
        spreadsheetId: string = "19QL4S7C_6KmIEkiwyg30AKKZ5WTJG3vNl-z5PNSs5p0",
        gid: string = "1124062259"
    ): Promise<{
        success: boolean;
        data?: CSSpreadsheetData[];
        error?: string;
    }> {
        try {
            // 구글 스프레드시트를 CSV 형태로 가져오는 URL
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

            console.log("🔍 구글 스프레드시트 데이터 요청:", csvUrl);

            const response = await fetch(csvUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const csvText = await response.text();

            // CSV 데이터 파싱
            const lines = csvText.split("\n");
            const csData: CSSpreadsheetData[] = [];

            // 첫 번째 행은 헤더로 건너뛰고, 첫 번째 컬럼(A열)에서 주문번호 추출
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // CSV 파싱 (간단한 구현)
                const columns = line.split(",");
                const orderNumber = columns[0]
                    ? columns[0].replace(/"/g, "").trim()
                    : "";

                if (orderNumber) {
                    csData.push({
                        order_number: orderNumber,
                    });
                }
            }

            console.log(
                `📊 구글 스프레드시트에서 ${csData.length}개의 CS 주문번호를 가져왔습니다.`
            );

            return {
                success: true,
                data: csData,
            };
        } catch (error) {
            console.error("❌ 구글 스프레드시트 데이터 가져오기 실패:", error);
            return {
                success: false,
                error: `구글 스프레드시트 연동 실패: ${error}`,
            };
        }
    }

    /**
     * CS 주문번호 목록을 Set으로 변환 (빠른 검색을 위해)
     * @param csData CS 데이터 배열
     * @returns 주문번호 Set
     */
    static createOrderNumberSet(csData: CSSpreadsheetData[]): Set<string> {
        return new Set(csData.map((item) => item.order_number));
    }
}

