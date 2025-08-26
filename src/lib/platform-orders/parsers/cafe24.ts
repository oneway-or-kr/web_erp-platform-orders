// 카페24 자사몰 CSV 파일 파싱
import { StandardOrderData, FileUtils } from "../utils";

export class Cafe24Parser {
    static async parse(file: File): Promise<StandardOrderData[]> {
        try {
            const rawData = await FileUtils.readCSVFile(file);
            const standardizedData: StandardOrderData[] = [];

            // 첫 번째 행은 헤더로 간주하고 건너뛰기
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];

                // 빈 행 건너뛰기
                if (!row || row.length === 0 || !row[0]) continue;

                // 카페24 CSV 구조에 맞게 매핑
                // 요구사항에 따른 컬럼 매핑 (실제 CSV 구조에 맞게 조정 필요)
                const orderNumber = this.safeString(row[0]); // 주문번호 컬럼
                const orderName = this.safeString(row[1]); // 주문자
                const orderPhone = this.safeString(row[2]); // 주문자핸드폰
                const receiverName = this.safeString(row[3]); // 수령인
                const receiverPhone = this.safeString(row[4]); // 핸드폰
                const receiverPost = this.safeString(row[5]); // 주문자우편번호
                const receiverAddress = this.safeString(row[6]); // 주소
                const productName = this.safeString(row[7]); // 주문상품명
                const optionName = this.safeString(row[8]); // 옵션
                const quantity = this.safeNumber(row[9]); // 수량
                const finalPrice = FileUtils.parsePrice(row[10] || 0); // 판매가

                // 디버깅용 로깅 (개발 모드에서만)
                if (process.env.NODE_ENV === "development" && i <= 3) {
                    console.log(`카페24 파싱 행 ${i}:`, {
                        raw_row: row,
                        parsed: {
                            orderNumber,
                            orderName,
                            orderPhone,
                            receiverName,
                            productName,
                        },
                    });
                }

                const orderData: StandardOrderData = {
                    order_number: orderNumber,
                    order_name: orderName,
                    order_date: FileUtils.parseCafe24Date(orderNumber), // 주문번호 앞 8자리로 날짜 생성
                    receiver_name: receiverName,
                    receiver_phone: FileUtils.formatPhone(receiverPhone),
                    receiver_post: FileUtils.padZip(receiverPost),
                    receiver_address: receiverAddress,
                    product_name: productName,
                    option_name: optionName,
                    quantity: quantity,
                    final_price: finalPrice,
                    platform: "자사몰",
                    order_phone: FileUtils.formatPhone(orderPhone),
                };

                standardizedData.push(orderData);
            }

            return standardizedData;
        } catch (error) {
            throw new Error(`카페24 CSV 파일 파싱 실패: ${error}`);
        }
    }

    /**
     * 안전한 문자열 변환 (null, undefined, 숫자 0 처리)
     */
    private static safeString(
        value: string | number | null | undefined
    ): string {
        if (value === null || value === undefined) return "";
        if (typeof value === "number" && value === 0) return "";
        return String(value).trim();
    }

    /**
     * 안전한 숫자 변환
     */
    private static safeNumber(
        value: string | number | null | undefined
    ): number {
        if (value === null || value === undefined || value === "") return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    static validate(data: StandardOrderData[]): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const rowNum = i + 1;

            if (!item.order_number) {
                errors.push(`${rowNum}행: 주문번호가 누락되었습니다.`);
            }

            if (!item.order_name) {
                errors.push(`${rowNum}행: 주문자명이 누락되었습니다.`);
            }

            if (!item.order_date) {
                errors.push(
                    `${rowNum}행: 주문일자를 생성할 수 없습니다. (주문번호 형식 확인: ${item.order_number})`
                );
            }

            if (!item.product_name) {
                errors.push(`${rowNum}행: 상품명이 누락되었습니다.`);
            }

            if (item.quantity <= 0) {
                errors.push(
                    `${rowNum}행: 수량이 올바르지 않습니다. (${item.quantity})`
                );
            }

            if (item.final_price <= 0) {
                errors.push(
                    `${rowNum}행: 판매가가 올바르지 않습니다. (${item.final_price})`
                );
            }
        }

        return { isValid: errors.length === 0, errors };
    }
}

// 하위 호환성을 위해 기존 클래스명도 유지
export const OwnMallParser = Cafe24Parser;
