"use client";

import { useState, useRef } from "react";
import { ReviewSmsExcelParser } from "@/lib/review-sms/excel-parser";
import { ReviewSmsDataProcessor } from "@/lib/review-sms/data-processor";
import {
    OrderData,
    ReturnExchangeData,
    UploadedFile,
    FilteringResult,
    ExcelProcessingResult,
} from "@/lib/review-sms/types";

interface ProcessingResult extends FilteringResult {
    csError?: string;
}

export default function ReviewSmsPage() {
    // 파일 업로드 상태
    const [, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [processing, setProcessing] = useState(false);

    // 파싱된 데이터
    const [ordersData, setOrdersData] = useState<OrderData[]>([]);
    const [returnsData, setReturnsData] = useState<ReturnExchangeData[]>([]);
    const [exchangesData, setExchangesData] = useState<ReturnExchangeData[]>(
        []
    );

    // 처리 결과
    const [processingResult, setProcessingResult] =
        useState<ProcessingResult | null>(null);
    const [processingLogs, setProcessingLogs] = useState<string[]>([]);

    // 파일 input refs
    const ordersFileRef = useRef<HTMLInputElement>(null);
    const returnsFileRef = useRef<HTMLInputElement>(null);
    const exchangesFileRef = useRef<HTMLInputElement>(null);
    const multiFileRef = useRef<HTMLInputElement>(null);

    // 로그 추가 함수
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setProcessingLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    };

    // 파일 업로드 핸들러
    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        fileType: "orders" | "returns" | "exchanges"
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const uploadedFile: UploadedFile = {
            file,
            type: fileType,
            status: "processing",
        };

        setUploadedFiles((prev) => [
            ...prev.filter((f) => f.type !== fileType),
            uploadedFile,
        ]);
        addLog(`📄 ${file.name} 파일 처리 시작...`);

        try {
            let result: ExcelProcessingResult;

            if (fileType === "orders") {
                result = await ReviewSmsExcelParser.parseOrdersFile(file);
                if (result.success && result.data) {
                    setOrdersData(result.data as OrderData[]);
                    addLog(
                        `✅ 주문 데이터 ${
                            (result.data as OrderData[]).length
                        }건 로드 완료`
                    );
                }
            } else {
                result = await ReviewSmsExcelParser.parseReturnExchangeFile(
                    file,
                    fileType
                );
                if (result.success && result.data) {
                    const data = result.data as ReturnExchangeData[];
                    if (fileType === "returns") {
                        setReturnsData(data);
                        addLog(`✅ 반품 데이터 ${data.length}건 로드 완료`);
                    } else {
                        setExchangesData(data);
                        addLog(`✅ 교환 데이터 ${data.length}건 로드 완료`);
                    }
                }
            }

            if (!result.success) {
                addLog(
                    `❌ ${file.name} 파일 처리 실패: ${result.errors?.join(
                        ", "
                    )}`
                );
                uploadedFile.status = "error";
                uploadedFile.message = result.errors?.join(", ");
            } else {
                uploadedFile.status = "completed";
                uploadedFile.message = "파일 처리 완료";
            }
        } catch (error) {
            addLog(`❌ ${file.name} 파일 처리 중 오류: ${error}`);
            uploadedFile.status = "error";
            uploadedFile.message = `처리 오류: ${error}`;
        }

        setUploadedFiles((prev) =>
            prev.map((f) => (f.type === fileType ? uploadedFile : f))
        );
    };

    // 다중 파일 업로드 핸들러 (자동 감지)
    const handleMultiFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        setProcessing(true);
        addLog(`📁 ${files.length}개 파일 자동 감지 시작...`);

        for (const file of files) {
            const detectedType = ReviewSmsExcelParser.detectFileType(file.name);

            if (detectedType === "unknown") {
                addLog(`⚠️ ${file.name}: 파일 타입을 감지할 수 없습니다.`);
                continue;
            }

            addLog(`🔍 ${file.name}: ${detectedType} 파일로 감지`);

            // 가상의 이벤트 객체 생성하여 기존 핸들러 재사용
            const virtualEvent = {
                target: { files: [file] },
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            await handleFileUpload(virtualEvent, detectedType);
        }

        setProcessing(false);
        addLog(`🎉 전체 파일 처리 완료`);
    };

    // 주소록 추출 처리
    const handleExtractContacts = async () => {
        if (ordersData.length === 0) {
            addLog(
                "❌ 주문 데이터가 없습니다. 먼저 주문 엑셀 파일을 업로드해주세요."
            );
            return;
        }

        setProcessing(true);
        addLog("🔄 주소록 추출 및 필터링 시작...");

        try {
            const result = await ReviewSmsDataProcessor.processWithGoogleSheets(
                ordersData,
                returnsData,
                exchangesData
            );

            setProcessingResult(result);

            addLog(
                `📊 필터링 완료: 원본 ${result.originalCount}건 → 최종 ${result.finalCount}건`
            );
            addLog(`   └ 반품 제외: ${result.removedData.returns.length}건`);
            addLog(`   └ 교환 제외: ${result.removedData.exchanges.length}건`);
            addLog(`   └ CS 제외: ${result.removedData.cs.length}건`);

            if (result.csError) {
                addLog(`⚠️ CS 데이터 연동 오류: ${result.csError}`);
            }
        } catch (error) {
            addLog(`❌ 주소록 추출 실패: ${error}`);
        }

        setProcessing(false);
    };

    // CSV 다운로드
    const handleDownloadCSV = () => {
        if (!processingResult || processingResult.finalData.length === 0) {
            addLog("❌ 다운로드할 데이터가 없습니다.");
            return;
        }

        const csvContent = ReviewSmsDataProcessor.convertToCSV(
            processingResult.finalData
        );
        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[-:]/g, "");
        const filename = `review_sms_list_${timestamp}.csv`;

        ReviewSmsDataProcessor.downloadCSV(csvContent, filename);
        addLog(`💾 ${filename} 다운로드 완료`);
    };

    // DB 저장
    const handleSaveToDatabase = async () => {
        if (!processingResult || processingResult.finalData.length === 0) {
            addLog("❌ 저장할 데이터가 없습니다.");
            return;
        }

        setProcessing(true);
        addLog(
            `💾 ${processingResult.finalData.length}건의 데이터를 DB에 저장 중...`
        );

        try {
            const response = await fetch("/api/review-sms/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderData: processingResult.finalData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                addLog(`✅ DB 저장 완료: ${result.count}건 저장됨`);
                addLog(`📊 플랫폼: 쿠팡, 발송상태: 대기중`);
            } else {
                addLog(`❌ DB 저장 실패: ${result.error}`);
                if (
                    result.error.includes("relation") ||
                    result.error.includes("table")
                ) {
                    addLog(
                        "💡 테이블이 없을 수 있습니다. supabase-setup.sql을 SQL Editor에서 실행해주세요."
                    );
                }
            }
        } catch (error) {
            addLog(`❌ DB 저장 중 오류: ${error}`);
        }

        setProcessing(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📱 쿠팡 자동 리뷰문자 발송 툴
                    </h1>
                    <p className="text-gray-600">
                        쿠팡 주문 엑셀 파일에서 반품/교환/CS 건을 제외하여 리뷰
                        문자 발송 대상을 추출하고 DB에 저장합니다.
                    </p>
                </div>

                {/* 파일 업로드 섹션 */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        📂 파일 업로드
                    </h2>

                    {/* 다중 파일 업로드 (자동 감지) */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium mb-2">
                            🚀 자동 감지 업로드 (권장)
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                            DeliveryList, returnDelivery, Exchange 파일을 한번에
                            선택하면 자동으로 구분합니다.
                        </p>
                        <input
                            ref={multiFileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            multiple
                            onChange={handleMultiFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => multiFileRef.current?.click()}
                            disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            📁 여러 파일 선택
                        </button>
                    </div>

                    {/* 개별 파일 업로드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 주문 파일 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-2xl mb-2">🛒</div>
                                <h3 className="font-medium mb-2">
                                    주문 엑셀파일
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                    DeliveryList(YYYY-MM-DD).xlsx
                                </p>
                                <input
                                    ref={ordersFileRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        handleFileUpload(e, "orders")
                                    }
                                    className="hidden"
                                />
                                <button
                                    onClick={() =>
                                        ordersFileRef.current?.click()
                                    }
                                    disabled={processing}
                                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                >
                                    파일 선택
                                </button>
                                {ordersData.length > 0 && (
                                    <p className="text-xs text-green-600 mt-2">
                                        ✅ {ordersData.length}건 로드됨
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 반품 파일 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-2xl mb-2">↩️</div>
                                <h3 className="font-medium mb-2">
                                    반품 엑셀파일
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                    returnDeliveryYYYY.MM.DD.xlsx
                                </p>
                                <input
                                    ref={returnsFileRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        handleFileUpload(e, "returns")
                                    }
                                    className="hidden"
                                />
                                <button
                                    onClick={() =>
                                        returnsFileRef.current?.click()
                                    }
                                    disabled={processing}
                                    className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                >
                                    파일 선택
                                </button>
                                {returnsData.length > 0 && (
                                    <p className="text-xs text-red-600 mt-2">
                                        ✅ {returnsData.length}건 로드됨
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 교환 파일 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-2xl mb-2">🔄</div>
                                <h3 className="font-medium mb-2">
                                    교환 엑셀파일
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                    ExchangeYYYY.MM.DD.xlsx
                                </p>
                                <input
                                    ref={exchangesFileRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        handleFileUpload(e, "exchanges")
                                    }
                                    className="hidden"
                                />
                                <button
                                    onClick={() =>
                                        exchangesFileRef.current?.click()
                                    }
                                    disabled={processing}
                                    className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                                >
                                    파일 선택
                                </button>
                                {exchangesData.length > 0 && (
                                    <p className="text-xs text-orange-600 mt-2">
                                        ✅ {exchangesData.length}건 로드됨
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 주소록 추출 버튼 */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleExtractContacts}
                            disabled={processing || ordersData.length === 0}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                            {processing ? "🔄 처리 중..." : "📋 주소록 추출"}
                        </button>
                    </div>
                </div>

                {/* 처리 결과 */}
                {processingResult && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            📊 처리 결과
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {processingResult.originalCount}
                                </div>
                                <div className="text-sm text-gray-600">
                                    원본 주문
                                </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {processingResult.finalCount}
                                </div>
                                <div className="text-sm text-gray-600">
                                    최종 발송 대상
                                </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {processingResult.removedCount}
                                </div>
                                <div className="text-sm text-gray-600">
                                    제외된 건수
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-600">
                                    {Math.round(
                                        (processingResult.finalCount /
                                            processingResult.originalCount) *
                                            100
                                    )}
                                    %
                                </div>
                                <div className="text-sm text-gray-600">
                                    발송 비율
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={handleDownloadCSV}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                💾 CSV 다운로드
                            </button>
                            <button
                                onClick={handleSaveToDatabase}
                                disabled={processing}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? "💾 저장 중..." : "💾 DB에 저장"}
                            </button>
                            <button
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                                disabled
                            >
                                📱 문자 발송 (준비중)
                            </button>
                        </div>
                    </div>
                )}

                {/* 처리 로그 */}
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                    <h3 className="text-white mb-2">📋 처리 로그</h3>
                    {processingLogs.length === 0 ? (
                        <div className="text-gray-500">
                            파일을 업로드하면 처리 로그가 표시됩니다.
                        </div>
                    ) : (
                        processingLogs.map((log, index) => (
                            <div key={index} className="mb-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
