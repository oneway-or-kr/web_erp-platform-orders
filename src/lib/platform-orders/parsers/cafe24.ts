// 자사몰 플랫폼 엑셀 파일 파싱
import { StandardOrderData, FileUtils } from "../utils";

export class OwnMallParser {
    static async parse(file: File): Promise<StandardOrderData[]> {
        try {
            const rawData = await FileUtils.readExcelFile(file);
            const standardizedData: StandardOrderData[] = [];

            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];

                // TODO: 자사몰 파일 구조에 맞게 매핑
                const orderData: StandardOrderData = {
                    order_number: "",
                    order_name: "",
                    order_date: "",
                    receiver_name: "",
                    receiver_phone: "",
                    receiver_post: "",
                    receiver_address: "",
                    product_name: "",
                    option_name: "",
                    quantity: 0,
                    final_price: 0,
                    platform: "자사몰",
                    order_phone: "",
                };

                standardizedData.push(orderData);
            }

            return standardizedData;
        } catch (error) {
            throw new Error(`자사몰 파일 파싱 실패: ${error}`);
        }
    }

    static validate(data: StandardOrderData[]): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];
        // TODO: 자사몰 특정 검증 로직
        return { isValid: errors.length === 0, errors };
    }
}
