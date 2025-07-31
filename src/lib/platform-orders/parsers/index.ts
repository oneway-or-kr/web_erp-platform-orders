// 모든 플랫폼 파서들을 통합 관리
import { NaverParser } from "./naver";
import { TossParser } from "./toss";
import { CoupangParser } from "./coupang";
import { OhouseParser } from "./ohouse";
import { ESMParser } from "./esm";
import { ElevenstParser } from "./elevenst";
import { AlwaysParser } from "./always";
import { OwnMallParser } from "./cafe24";
import { KakaoParser } from "./kakao";
import { StandardOrderData } from "../utils";

export interface PlatformParser {
    parse(file: File): Promise<StandardOrderData[]>;
    validate(data: StandardOrderData[]): { isValid: boolean; errors: string[] };
}

export const PLATFORM_PARSERS: Record<string, PlatformParser> = {
    "naver-oneway": NaverParser,
    "naver-hygge": NaverParser,
    toss: TossParser,
    coupang: CoupangParser,
    ohouse: OhouseParser,
    esm: ESMParser,
    elevenst: ElevenstParser,
    always: AlwaysParser,
    cafe24: OwnMallParser,
    kakao: KakaoParser,
};

export {
    NaverParser,
    TossParser,
    CoupangParser,
    OhouseParser,
    ESMParser,
    ElevenstParser,
    AlwaysParser,
    OwnMallParser,
    KakaoParser,
};
