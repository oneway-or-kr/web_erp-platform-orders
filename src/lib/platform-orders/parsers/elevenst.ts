// 11번가 플랫폼 엑셀 파일 파싱
import { StandardOrderData, FileUtils } from "../utils";

export class ElevenstParser {
    static async parse(file: File): Promise<StandardOrderData[]> {
        try {
            const rawData = await FileUtils.readExcelFile(file);
            const standardizedData: StandardOrderData[] = [];

            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];

                // TODO: 11번가 파일 구조에 맞게 매핑
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
                    platform: "11번가",
                    order_phone: "",
                };

                standardizedData.push(orderData);
            }

            return standardizedData;
        } catch (error) {
            throw new Error(`11번가 파일 파싱 실패: ${error}`);
        }
    }

    static validate(data: StandardOrderData[]): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];
        // TODO: 11번가 특정 검증 로직
        return { isValid: errors.length === 0, errors };
    }
}
