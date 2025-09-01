// 리뷰 문자 발송 툴 관련 타입 정의

// 주문 데이터 인터페이스
export interface OrderData {
    order_number: string; // 주문번호
    product_name: string; // 등록상품명
    receiver_name: string; // 수취인이름
    receiver_phone: string; // 수취인전화번호
}

// 반품/교환 데이터 인터페이스
export interface ReturnExchangeData {
    order_number: string; // 주문번호
    receiver_name: string; // 수취인이름
}

// CS 스프레드시트 데이터 인터페이스
export interface CSSpreadsheetData {
    order_number: string; // 주문번호 (A열)
}

// 파일 업로드 타입
export interface UploadedFile {
    file: File;
    type: "orders" | "returns" | "exchanges";
    status: "pending" | "processing" | "completed" | "error";
    message?: string;
}

// 필터링 결과
export interface FilteringResult {
    originalCount: number;
    finalCount: number;
    removedCount: number;
    finalData: OrderData[];
    removedData: {
        returns: OrderData[];
        exchanges: OrderData[];
        cs: OrderData[];
    };
}

// 엑셀 파일 처리 결과
export interface ExcelProcessingResult {
    success: boolean;
    data?: OrderData[] | ReturnExchangeData[];
    errors?: string[];
    fileName?: string;
    fileType?: "orders" | "returns" | "exchanges";
}

