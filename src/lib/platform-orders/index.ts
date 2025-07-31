// 파일 처리 라이브러리 메인 엔트리 포인트
export * from "./detector";
export * from "./utils";
export * from "./processor";
export * from "./parsers";

// 주요 클래스들을 직접 export
export { FileDetector } from "./detector";
export { FileUtils, type StandardOrderData } from "./utils";
export { FileProcessor, type ProcessingResult } from "./processor";
export { PLATFORM_PARSERS, type PlatformParser } from "./parsers";
