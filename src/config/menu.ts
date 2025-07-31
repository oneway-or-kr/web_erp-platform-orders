// 메뉴 아이템 타입 정의
export interface MenuItem {
    name: string;
    href?: string;
    children?: MenuItem[];
    isCategory?: boolean;
}

// 메뉴 구성 데이터
export const menuConfig: MenuItem[] = [
    {
        name: "Operation",
        isCategory: true,
        children: [
            {
                name: "플랫폼별 주문 업로드",
                href: "/dashboard/platform-orders",
            },
            // 향후 추가될 메뉴들
            // {
            //     name: "재고 관리",
            //     href: "/dashboard/inventory",
            // },
        ],
    },
    // 향후 추가될 카테고리들
    // {
    //     name: "Analytics",
    //     isCategory: true,
    //     children: [
    //         {
    //             name: "매출 분석",
    //             href: "/dashboard/sales-analytics",
    //         },
    //         {
    //             name: "고객 분석",
    //             href: "/dashboard/customer-analytics",
    //         },
    //     ],
    // },
    // {
    //     name: "Settings",
    //     isCategory: true,
    //     children: [
    //         {
    //             name: "시스템 설정",
    //             href: "/dashboard/system-settings",
    //         },
    //         {
    //             name: "사용자 관리",
    //             href: "/dashboard/user-management",
    //         },
    //     ],
    // },
];
