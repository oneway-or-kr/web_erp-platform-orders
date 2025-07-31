"use client";

import { useState, useEffect, useRef } from "react";
import { FileProcessor, type ProcessingResult } from "@/lib/platform-orders";

interface UploadedFile {
    platform: string;
    file: File;
    status: "pending" | "processing" | "completed" | "error";
    message?: string;
}

interface AutoUploadedFile {
    file: File;
    status: "pending" | "processing" | "completed" | "error";
    platform?: string;
    message?: string;
    result?: ProcessingResult;
}

export default function PlatformOrdersPage() {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [processing, setProcessing] = useState(false);

    // 자동 업로드용 상태
    const [autoUploadedFiles, setAutoUploadedFiles] = useState<
        AutoUploadedFile[]
    >([]);
    const [autoProcessing, setAutoProcessing] = useState(false);
    const [integratedResult, setIntegratedResult] =
        useState<ProcessingResult | null>(null);
    const [processingLogs, setProcessingLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 수동 업로드 처리 결과 저장
    const [manualResults, setManualResults] = useState<ProcessingResult[]>([]);

    // 로그가 업데이트될 때마다 자동 스크롤
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop =
                logContainerRef.current.scrollHeight;
        }
    }, [processingLogs]);

    const platforms = [
        { id: "naver-oneway", name: "네이버 원웨이" },
        { id: "naver-hygge", name: "네이버 휘게" },
        { id: "toss", name: "토스" },
        { id: "coupang", name: "쿠팡" },
        { id: "ohouse", name: "오늘의집" },
        { id: "esm", name: "ESM (G마켓 · 옥션)" },
        { id: "elevenst", name: "11번가" },
        { id: "always", name: "올웨이즈" },
        { id: "cafe24", name: "자사몰" },
        { id: "kakao", name: "카카오" },
    ];

    const handleFileUpload = async (
        platform: string,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file && file.type.includes("sheet")) {
            const newFile: UploadedFile = {
                platform,
                file,
                status: "processing", // 즉시 처리 시작
            };

            // 기존 같은 플랫폼 파일 제거 후 새 파일 추가
            setUploadedFiles((prev) => [
                ...prev.filter((f) => f.platform !== platform),
                newFile,
            ]);

            addLog(`📄 ${file.name} (${platform}) 파일 처리를 시작합니다.`);

            try {
                // 플랫폼별 파서를 사용해서 파일 처리
                const result = await FileProcessor.processWithPlatform(
                    file,
                    platform
                );

                if (result.success) {
                    addLog(`✅ ${file.name}: ${platform} 플랫폼으로 처리 완료`);

                    // 처리 결과를 manualResults에 저장
                    setManualResults((prev) => [
                        ...prev.filter((r) => r.fileName !== file.name),
                        result,
                    ]);

                    // 파일 상태 업데이트
                    setUploadedFiles((prev) =>
                        prev.map((f) =>
                            f.platform === platform && f.file.name === file.name
                                ? {
                                      ...f,
                                      status: "completed",
                                      message: "처리 완료",
                                  }
                                : f
                        )
                    );
                } else {
                    addLog(
                        `❌ ${file.name}: 처리 실패 - ${result.errors?.join(
                            ", "
                        )}`
                    );

                    // 파일 상태 업데이트
                    setUploadedFiles((prev) =>
                        prev.map((f) =>
                            f.platform === platform && f.file.name === file.name
                                ? {
                                      ...f,
                                      status: "error",
                                      message:
                                          result.errors?.join(", ") ||
                                          "처리 실패",
                                  }
                                : f
                        )
                    );
                }
            } catch (error) {
                addLog(`❌ ${file.name}: 오류 발생 - ${error}`);

                // 파일 상태 업데이트
                setUploadedFiles((prev) =>
                    prev.map((f) =>
                        f.platform === platform && f.file.name === file.name
                            ? {
                                  ...f,
                                  status: "error",
                                  message: `처리 중 오류: ${error}`,
                              }
                            : f
                    )
                );
            }
        } else {
            alert("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
        }

        // 파일 입력 초기화
        event.target.value = "";
    };

    const removeFile = (platform: string) => {
        const removedFile = uploadedFiles.find((f) => f.platform === platform);
        if (removedFile) {
            addLog(
                `🗑️ ${removedFile.file.name} (${platform}) 파일이 제거되었습니다.`
            );

            // 파일 목록에서 제거
            setUploadedFiles((prev) =>
                prev.filter((f) => f.platform !== platform)
            );

            // 처리 결과에서도 제거
            setManualResults((prev) =>
                prev.filter((r) => r.fileName !== removedFile.file.name)
            );
        }
    };

    // 로그 추가 함수
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setProcessingLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    };

    // 자동 업로드 파일 선택 핸들러
    const handleAutoFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (files) {
            const newFiles: AutoUploadedFile[] = Array.from(files)
                .filter((file) => file.type.includes("sheet"))
                .map((file) => ({
                    file,
                    status: "pending" as const,
                }));

            if (newFiles.length === 0) {
                alert("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
                return;
            }

            // 기존 데이터 초기화 후 새로운 파일로 시작
            setAutoUploadedFiles([]);
            setIntegratedResult(null);
            setProcessingLogs([]);

            // 새로운 파일 설정
            setAutoUploadedFiles(newFiles);

            // 파일 선택 즉시 자동 처리 시작
            addLog(
                `=== ${newFiles.length}개 파일 업로드 완료, 자동 처리를 시작합니다. ===`
            );
            await processAutoFilesInternal(newFiles);
        }
        // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
        event.target.value = "";
    };

    // 내부 자동 파일 처리 함수
    const processAutoFilesInternal = async (
        filesToProcess: AutoUploadedFile[]
    ) => {
        setAutoProcessing(true);
        const processedResults: ProcessingResult[] = [];

        try {
            // 각 파일을 순차적으로 처리
            for (let i = 0; i < filesToProcess.length; i++) {
                const fileItem = filesToProcess[i];
                addLog(`📄 ${fileItem.file.name} 파일 처리를 시작합니다.`);

                // 처리 중 상태로 업데이트
                setAutoUploadedFiles((prev) =>
                    prev.map((item, idx) =>
                        idx === i ? { ...item, status: "processing" } : item
                    )
                );

                try {
                    // 플랫폼 자동 감지 및 파싱
                    const result = await FileProcessor.processSingleFile(
                        fileItem.file
                    );
                    processedResults.push(result);

                    if (result.success) {
                        addLog(
                            `✅ ${fileItem.file.name}: ${result.platform} 플랫폼으로 감지되어 처리 완료`
                        );
                    } else {
                        addLog(
                            `❌ ${
                                fileItem.file.name
                            }: 처리 실패 - ${result.errors?.join(", ")}`
                        );
                    }

                    // 결과에 따라 상태 업데이트
                    setAutoUploadedFiles((prev) =>
                        prev.map((item, idx) =>
                            idx === i
                                ? {
                                      ...item,
                                      status: result.success
                                          ? "completed"
                                          : "error",
                                      platform: result.platform,
                                      message: result.success
                                          ? `${result.platform} 플랫폼으로 감지됨`
                                          : result.errors?.join(", ") ||
                                            "처리 실패",
                                      result,
                                  }
                                : item
                        )
                    );
                } catch (error) {
                    addLog(`❌ ${fileItem.file.name}: 오류 발생 - ${error}`);
                    setAutoUploadedFiles((prev) =>
                        prev.map((item, idx) =>
                            idx === i
                                ? {
                                      ...item,
                                      status: "error",
                                      message: `파일 처리 중 오류 발생: ${error}`,
                                  }
                                : item
                        )
                    );
                }
            }

            // 성공한 파일들을 통합 처리
            addLog("=== 개별 파일 처리 완료, 통합 CSV 생성을 시작합니다. ===");
            const integratedResult =
                FileProcessor.integrateFiles(processedResults);
            setIntegratedResult(integratedResult);

            const successCount = processedResults.filter(
                (r) => r.success
            ).length;
            if (integratedResult.success) {
                addLog(
                    `✅ 통합 완료: ${successCount}개 파일에서 ${integratedResult.data?.length}개 주문을 통합했습니다.`
                );
                addLog("CSV 다운로드 버튼을 클릭하여 결과를 다운로드하세요.");
            } else {
                addLog(
                    `❌ 통합 실패: ${
                        integratedResult.errors?.join(", ") || "알 수 없는 오류"
                    }`
                );
            }
        } catch (error) {
            addLog(`❌ 전체 처리 중 오류 발생: ${error}`);
        } finally {
            setAutoProcessing(false);
        }
    };

    // 상태 초기화 함수
    const resetAll = () => {
        setAutoUploadedFiles([]);
        setUploadedFiles([]); // 수동 업로드 파일들도 초기화
        setManualResults([]); // 수동 업로드 결과도 초기화
        setIntegratedResult(null);
        setProcessing(false);
        setAutoProcessing(false);
        setProcessingLogs([]);
        setTimeout(() => {
            addLog(
                "=== 시스템이 초기화되었습니다. 새로운 파일을 업로드할 수 있습니다. ==="
            );
        }, 100);
    };

    // CSV 다운로드 핸들러 (자동 + 수동 결과 통합)
    const downloadIntegratedCSV = () => {
        // 자동 업로드 결과와 수동 업로드 결과를 통합
        const allResults: ProcessingResult[] = [];

        // 자동 업로드 결과 추가 (성공한 것만)
        if (
            integratedResult &&
            integratedResult.success &&
            integratedResult.data
        ) {
            allResults.push(integratedResult);
        }

        // 수동 업로드 결과 추가 (성공한 것만)
        const successfulManualResults = manualResults.filter(
            (result) => result.success
        );
        allResults.push(...successfulManualResults);

        if (allResults.length === 0) {
            alert("다운로드할 처리 완료된 파일이 없습니다.");
            return;
        }

        // 모든 결과를 통합하여 CSV 생성
        const finalIntegratedResult = FileProcessor.integrateFiles(allResults);

        if (finalIntegratedResult.success && finalIntegratedResult.csvContent) {
            const autoCount = integratedResult?.success ? 1 : 0;
            const manualCount = successfulManualResults.length;
            const totalOrders = finalIntegratedResult.data?.length || 0;

            addLog(
                `=== 통합 CSV 생성: 자동업로드(${autoCount}) + 수동업로드(${manualCount}) = 총 ${totalOrders}개 주문 ===`
            );

            FileProcessor.downloadCSV(finalIntegratedResult.csvContent);
            addLog("=== CSV 파일 다운로드가 완료되었습니다. ===");

            // 다운로드 완료 후 초기화 확인
            setTimeout(() => {
                if (
                    confirm(
                        "CSV 다운로드가 완료되었습니다.\n\n중복 처리를 방지하기 위해 초기화하겠습니까?"
                    )
                ) {
                    resetAll();
                }
            }, 500);
        } else {
            alert(
                "CSV 생성에 실패했습니다: " +
                    (finalIntegratedResult.errors?.join(", ") ||
                        "알 수 없는 오류")
            );
        }
    };

    const processFiles = async () => {
        // 이제 개별 파일이 업로드되자마자 처리되므로,
        // 이 함수는 단순히 완료된 파일들의 통합 CSV 다운로드를 트리거
        const completedFiles = uploadedFiles.filter(
            (f) => f.status === "completed"
        );

        if (completedFiles.length === 0) {
            alert(
                "처리 완료된 파일이 없습니다. 파일이 업로드되면 자동으로 처리됩니다."
            );
            return;
        }

        addLog(
            `=== 수동 업로드 파일 ${completedFiles.length}개 처리 완료 확인 ===`
        );
        downloadIntegratedCSV();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-gray-100 text-gray-800";
            case "processing":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "error":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending":
                return "대기 중";
            case "processing":
                return "처리 중";
            case "completed":
                return "완료";
            case "error":
                return "오류";
            default:
                return "알 수 없음";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    플랫폼별 주문 업로드
                </h1>
                <p className="text-gray-600">
                    각 플랫폼의 주문 엑셀 파일을 업로드하여 통합 CSV 파일로
                    변환합니다.
                </p>
            </div>

            {/* 로그창과 CSV 다운로드 */}
            <div className="flex gap-4">
                {/* 로그창 */}
                <div className="flex-1 bg-white rounded-lg">
                    <div
                        ref={logContainerRef}
                        className="p-4 h-20 overflow-y-auto"
                    >
                        <div className="space-y-1">
                            {processingLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className="text-xs text-gray-700 font-mono"
                                >
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CSV 다운로드 및 초기화 버튼 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadIntegratedCSV}
                        disabled={
                            (!integratedResult || !integratedResult.success) &&
                            manualResults.filter((r) => r.success).length === 0
                        }
                        className={`px-4 py-2 text-sm font-bold rounded-md text-white ${
                            (integratedResult && integratedResult.success) ||
                            manualResults.filter((r) => r.success).length > 0
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        CSV 다운로드
                    </button>

                    {/* 수동 초기화 버튼 */}
                    <button
                        onClick={resetAll}
                        disabled={
                            autoUploadedFiles.length === 0 &&
                            uploadedFiles.length === 0 &&
                            manualResults.length === 0 &&
                            !integratedResult &&
                            processingLogs.length <= 1
                        }
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                            autoUploadedFiles.length > 0 ||
                            uploadedFiles.length > 0 ||
                            manualResults.length > 0 ||
                            integratedResult ||
                            processingLogs.length > 1
                                ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                : "text-gray-400 bg-gray-100 cursor-not-allowed"
                        }`}
                    >
                        초기화
                    </button>
                </div>
            </div>

            {/* 자동 업로드 섹션 */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        자동 업로드
                    </h2>
                    <div className="flex space-x-2">
                        <input
                            type="file"
                            multiple
                            accept=".xlsx,.xls"
                            onChange={handleAutoFileUpload}
                            className="hidden"
                            id="auto-file-upload"
                            disabled={autoProcessing}
                        />
                        <label
                            htmlFor="auto-file-upload"
                            className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-md text-white ${
                                autoProcessing
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                        >
                            {autoProcessing ? "처리 중..." : "파일 선택"}
                        </label>
                    </div>
                </div>
            </div>

            {/* 파일 업로드 섹션 */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-3">
                    <h2 className="text-lg font-medium text-gray-900">
                        파일 업로드
                    </h2>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 gap-2">
                        {platforms.map((platform) => {
                            const uploadedFile = uploadedFiles.find(
                                (f) => f.platform === platform.id
                            );

                            return (
                                <div
                                    key={platform.id}
                                    className="bg-gray-50 rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="font-medium text-gray-900 text-sm">
                                                {platform.name}
                                            </h3>
                                            {uploadedFile && (
                                                <div
                                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                        uploadedFile.status
                                                    )}`}
                                                >
                                                    {getStatusText(
                                                        uploadedFile.status
                                                    )}
                                                </div>
                                            )}
                                            {uploadedFile && (
                                                <span className="text-xs text-gray-500 truncate max-w-48">
                                                    {uploadedFile.file.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {!uploadedFile ? (
                                                <>
                                                    <input
                                                        type="file"
                                                        accept=".xlsx,.xls"
                                                        onChange={(e) =>
                                                            handleFileUpload(
                                                                platform.id,
                                                                e
                                                            )
                                                        }
                                                        className="hidden"
                                                        id={`file-${platform.id}`}
                                                    />
                                                    <label
                                                        htmlFor={`file-${platform.id}`}
                                                        className="cursor-pointer inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-100"
                                                    >
                                                        파일 선택
                                                    </label>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        removeFile(platform.id)
                                                    }
                                                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded"
                                                >
                                                    제거
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 pt-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {uploadedFiles.length}개 파일이 업로드됨
                                    </p>
                                </div>
                                <button
                                    onClick={processFiles}
                                    disabled={
                                        processing ||
                                        uploadedFiles.filter(
                                            (f) => f.status === "completed"
                                        ).length === 0
                                    }
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium"
                                >
                                    {processing ? "처리 중..." : "CSV 다운로드"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
