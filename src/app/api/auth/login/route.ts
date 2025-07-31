import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { id, password } = await request.json();

        // 환경변수에서 로그인 정보 가져오기
        const validId = process.env.LOGIN_ID || "admin";
        const validPassword = process.env.LOGIN_PASSWORD || "password123";

        if (id === validId && password === validPassword) {
            // 성공적인 로그인
            const response = NextResponse.json({
                success: true,
                message: "로그인 성공",
            });

            // 세션 쿠키 설정 (간단한 구현)
            response.cookies.set("auth-token", "authenticated", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24, // 24시간
            });

            return response;
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: "아이디 또는 비밀번호가 올바르지 않습니다.",
                },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
