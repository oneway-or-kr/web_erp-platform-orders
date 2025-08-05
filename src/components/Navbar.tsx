"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            localStorage.removeItem("isAuthenticated");
            router.push("/login");
        } catch (error) {
            console.error("로그아웃 오류:", error);
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="w-full px-2 sm:px-3 lg:px-4">
                <div className="flex justify-between h-16">
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <Image
                            src="/oneway_logo.png"
                            alt="Oneway Logo"
                            width={100}
                            height={100}
                            className="object-contain"
                        />
                        <h1 className="text-xl font-semibold text-gray-900">
                            Oneway ERP 어드민 페이지
                        </h1>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">관리자님</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
