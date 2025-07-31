"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // 인증 상태 확인 후 적절한 페이지로 리디렉션
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (isAuthenticated === "true") {
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg">리디렉션 중...</div>
        </div>
    );
}
