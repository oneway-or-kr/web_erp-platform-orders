"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuConfig, MenuItem } from "@/config/menu";

export default function Sidebar() {
    const pathname = usePathname();

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        if (item.isCategory) {
            return (
                <div key={item.name} className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {item.name}
                    </h3>
                    <div className="space-y-1">
                        {item.children?.map((child) =>
                            renderMenuItem(child, level + 1)
                        )}
                    </div>
                </div>
            );
        }

        if (item.href) {
            const isActive = pathname === item.href;
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        level > 0 ? "ml-2" : ""
                    } ${
                        isActive
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                    <span>{item.name}</span>
                </Link>
            );
        }

        return null;
    };

    return (
        <div className="w-64 bg-gray-50 h-full border-r border-gray-200">
            <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    메뉴
                </h2>
                <nav className="space-y-4">
                    {menuConfig.map((item) => renderMenuItem(item))}
                </nav>
            </div>
        </div>
    );
}
