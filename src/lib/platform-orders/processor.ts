// 파일 처리 메인 프로세서
import { FileDetector } from "./detector";
import { PLATFORM_PARSERS } from "./parsers";
import { StandardOrderData, FileUtils } from "./utils";

export interface ProcessingResult {
    success: boolean;
    data?: StandardOrderData[];
    csvContent?: string;
    errors?: string[];
    platform?: string;
    fileName?: string;
}

export class FileProcessor {
    /**
     * 단일 파일 처리 (자동 감지 + 파싱)
     * @param file 업로드된 엑셀 파일
     * @returns 처리 결과
     */
    static async processSingleFile(file: File): Promise<ProcessingResult> {
        try {
            // 1. 플랫폼 자동 감지
            const detection = await FileDetector.detectPlatform(file);

            if (!detection) {
                return {
                    success: false,
                    errors: ["플랫폼을 감지할 수 없습니다."],
                    fileName: file.name,
                };
            }

            // 2. 해당 플랫폼 파서로 파싱
            const parser = PLATFORM_PARSERS[detection.platform];
            if (!parser) {
                return {
                    success: false,
                    errors: [
                        `${detection.platform} 플랫폼 파서를 찾을 수 없습니다.`,
                    ],
                    platform: detection.platform,
                    fileName: file.name,
                };
            }

            const parsedData = await parser.parse(file);

            // 3. 데이터 검증
            const validationResult = parser.validate(parsedData);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    errors: validationResult.errors,
                    platform: detection.platform,
                    fileName: file.name,
                };
            }

            return {
                success: true,
                data: parsedData,
                platform: detection.platform,
                fileName: file.name,
            };
        } catch (error) {
            return {
                success: false,
                errors: [`파일 처리 중 오류 발생: ${error}`],
                fileName: file.name,
            };
        }
    }

    /**
     * 수동으로 플랫폼을 지정하여 파일 처리
     * @param file 업로드된 엑셀 파일
     * @param platform 지정된 플랫폼
     * @returns 처리 결과
     */
    static async processWithPlatform(
        file: File,
        platform: string
    ): Promise<ProcessingResult> {
        try {
            const parser = PLATFORM_PARSERS[platform];
            if (!parser) {
                return {
                    success: false,
                    errors: [`${platform} 플랫폼 파서를 찾을 수 없습니다.`],
                    platform,
                    fileName: file.name,
                };
            }

            // 모든 파서는 동일한 인터페이스 사용 (상품명 기반 자동 감지)
            const parsedData: StandardOrderData[] = await parser.parse(file);

            const validationResult = parser.validate(parsedData);

            if (!validationResult.isValid) {
                return {
                    success: false,
                    errors: validationResult.errors,
                    platform,
                    fileName: file.name,
                };
            }

            return {
                success: true,
                data: parsedData,
                platform,
                fileName: file.name,
            };
        } catch (error) {
            return {
                success: false,
                errors: [`파일 처리 중 오류 발생: ${error}`],
                platform,
                fileName: file.name,
            };
        }
    }

    /**
     * 여러 파일 통합 처리
     * @param fileResults 개별 파일 처리 결과들
     * @returns 통합 CSV 결과
     */
    static integrateFiles(fileResults: ProcessingResult[]): ProcessingResult {
        try {
            const successfulResults = fileResults.filter(
                (result) => result.success && result.data
            );

            if (successfulResults.length === 0) {
                return {
                    success: false,
                    errors: ["처리 성공한 파일이 없습니다."],
                };
            }

            // 모든 데이터 통합
            const allData: StandardOrderData[] = [];
            successfulResults.forEach((result) => {
                if (result.data) {
                    allData.push(...result.data);
                }
            });

            // CSV 변환
            const csvContent = FileUtils.convertToCSV(allData);

            return {
                success: true,
                data: allData,
                csvContent,
                platform: "integrated",
            };
        } catch (error) {
            return {
                success: false,
                errors: [`통합 처리 중 오류 발생: ${error}`],
            };
        }
    }

    /**
     * CSV 파일 다운로드
     * @param csvContent CSV 문자열
     * @param filename 파일명
     */
    static downloadCSV(csvContent: string, filename?: string): void {
        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[-:]/g, "");
        const defaultFilename = `integrated_orders_${timestamp}.csv`;
        FileUtils.downloadCSV(csvContent, filename || defaultFilename);
    }
}
