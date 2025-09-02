// 플랫폼별 엑셀 파일 자동 감지
import * as XLSX from "xlsx";

export interface DetectionResult {
    platform: string;
    confidence: number;
    reason: string;
}

/**
 * 플랫폼 이름 매핑
 */
export const platformNames: Record<string, string> = {
    "naver-oneway": "네이버 원웨이",
    "naver-hygge": "네이버 휘게",
    naver: "네이버",
    coupang: "쿠팡",
    toss: "토스",
    ohouse: "오늘의집",
    esm: "ESM (G마켓 · 옥션)",
    elevenst: "11번가",
    always: "올웨이즈",
    cafe24: "자사몰",
    kakao: "카카오",
};

export class FileDetector {
    /**
     * 업로드된 파일이 어떤 플랫폼의 파일인지 감지
     * @param file 업로드된 파일 (엑셀 또는 CSV)
     * @returns 감지된 플랫폼 정보
     */
    static async detectPlatform(file: File): Promise<DetectionResult | null> {
        try {
            // CSV 파일인 경우 카페24로 판단
            if (
                file.name.toLowerCase().endsWith(".csv") ||
                file.type === "text/csv"
            ) {
                return {
                    platform: "cafe24",
                    confidence: 0.9,
                    reason: "CSV 파일 형식",
                };
            }

            const arrayBuffer = await file.arrayBuffer();

            // 1단계: 파일명 기반 감지
            const platformByFilename = this.detectByFilename(file.name);

            // 네이버인 경우 T열 확인으로 원웨이/휘게 구분
            if (platformByFilename === "naver") {
                const detailedPlatform = this.detectNaverStore(arrayBuffer);
                return {
                    platform: detailedPlatform,
                    confidence: 0.9,
                    reason: "파일명과 내용 분석",
                };
            }

            if (platformByFilename) {
                return {
                    platform: platformByFilename,
                    confidence: 0.8,
                    reason: "파일명 패턴 매칭",
                };
            }

            return null;
        } catch (error) {
            console.error("플랫폼 감지 중 오류:", error);
            return null;
        }
    }

    /**
     * 파일명 기반 플랫폼 감지
     * @param filename 파일명
     * @returns 감지된 플랫폼 ID 또는 null
     */
    private static detectByFilename(filename: string): string | null {
        const cleanFilename = filename.toLowerCase();

        // 네이버 스마트스토어 패턴
        const normalizedFilename = filename.normalize("NFC");
        const normalizedTarget = "스마트스토어".normalize("NFC");

        if (
            normalizedFilename.includes(normalizedTarget) ||
            filename.startsWith("스마트")
        ) {
            return "naver";
        }

        // 쿠팡 패턴: DeliveryList(YYYY-07-18)_(0)
        if (
            cleanFilename.startsWith("deliverylist") &&
            /\(\d{4}-\d{2}-\d{2}\)_\(\d+\)/.test(cleanFilename)
        ) {
            return "coupang";
        }

        // 오늘의집 패턴: "주문배송 내역"
        const normalizedOhouseFilename = filename.normalize("NFC");
        const normalizedOhouseTarget = "주문배송 내역".normalize("NFC");

        if (
            normalizedOhouseFilename.includes(normalizedOhouseTarget) ||
            cleanFilename.includes("ohouse") ||
            filename.includes("오늘의집")
        ) {
            return "ohouse";
        }

        // 토스 패턴: 
        // - "주문내역-상품준비중-YYYY-MM-DD-YYYY-MM-DD"
        // - "주문내역-상품준비중-YYYY-MM-DD-YYYY-MM-DD"
        // - "주문내역-배송중-YYYY-MM-DD-YYYY-MM-DD"
        const normalizedTossFilename = filename.normalize("NFC");
        const normalizedTossTarget1 = "주문내역".normalize("NFC");
        const normalizedTossTarget2 = "상품준비중".normalize("NFC");
        const normalizedTossTarget3 = "배송중".normalize("NFC");
        const normalizedTossTarget4 = "토스".normalize("NFC");

        if (
            (normalizedTossFilename.includes(normalizedTossTarget1) &&
                (normalizedTossFilename.includes(normalizedTossTarget2) ||
                 normalizedTossFilename.includes(normalizedTossTarget3))) ||
            cleanFilename.includes("toss") ||
            normalizedTossFilename.includes(normalizedTossTarget4)
        ) {
            return "toss";
        }

        if (cleanFilename.includes("11st") || filename.includes("11번가")) {
            return "elevenst";
        }

        if (cleanFilename.includes("always") || filename.includes("올웨이즈")) {
            return "always";
        }

        if (cleanFilename.includes("cafe24") || filename.includes("자사몰")) {
            return "cafe24";
        }

        if (cleanFilename.includes("kakao") || filename.includes("카카오")) {
            return "kakao";
        }

        // ESM 패턴: "발송관리"
        const normalizedESMFilename = filename.normalize("NFC");
        const normalizedESMTarget = "발송관리".normalize("NFC");

        if (
            normalizedESMFilename.includes(normalizedESMTarget) ||
            cleanFilename.includes("esm")
        ) {
            return "esm";
        }

        return null;
    }

    /**
     * 네이버 스마트스토어에서 원웨이/휘게 구분
     * @param arrayBuffer 엑셀 파일 ArrayBuffer
     * @returns "naver-oneway" 또는 "naver-hygge"
     */
    private static detectNaverStore(arrayBuffer: ArrayBuffer): string {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // T열(19번째 열) 확인
            const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
            const columnT = 19; // T열은 0-based index로 19

            // T열의 모든 셀을 확인 (1행부터 끝까지)
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cellAddress = XLSX.utils.encode_cell({
                    c: columnT,
                    r: R,
                });
                const cell = sheet[cellAddress];

                if (cell && cell.v) {
                    const cellValue = String(cell.v);
                    const cellValueLower = cellValue.toLowerCase();

                    if (
                        cellValue.includes("휘게") ||
                        cellValue.includes("hygge") ||
                        cellValueLower.includes("휘게") ||
                        cellValueLower.includes("hygge")
                    ) {
                        return "naver-hygge";
                    }
                    if (
                        cellValue.includes("원웨이") ||
                        cellValue.includes("oneway") ||
                        cellValueLower.includes("원웨이") ||
                        cellValueLower.includes("oneway")
                    ) {
                        return "naver-oneway";
                    }
                }
            }

            return "naver-oneway";
        } catch (error) {
            console.error("네이버 스토어 구분 중 오류:", error);
            return "naver-oneway";
        }
    }

    /**
     * 플랫폼 이름 가져오기
     * @param platformId 플랫폼 ID
     * @returns 플랫폼 이름
     */
    static getPlatformName(platformId: string): string {
        return platformNames[platformId] || platformId;
    }

    /**
     * 지원되는 모든 플랫폼 목록 가져오기
     * @returns 플랫폼 목록
     */
    static getSupportedPlatforms(): Array<{ id: string; name: string }> {
        return Object.entries(platformNames).map(([id, name]) => ({
            id,
            name,
        }));
    }
}
