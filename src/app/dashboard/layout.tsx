"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 클라이언트에서 인증 상태 확인
        const authStatus = localStorage.getItem("isAuthenticated");
        if (authStatus === "true") {
            setIsAuthenticated(true);
        } else {
            router.push("/login");
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">로딩 중...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex h-[calc(100vh-4rem)]">
                <Sidebar />
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    );
}
