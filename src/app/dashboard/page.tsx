"use client";

import DashboardLinkHub from "@/components/DashboardLinkHub";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">MAIN </h1>
                <p className="text-gray-600">
                    Oneway ERP 어드민 페이지에 오신 것을 환영합니다.
                </p>
            </div>

            {/* 링크허브 섹션 */}
            <div>
                <DashboardLinkHub />
            </div>
        </div>
    );
}
