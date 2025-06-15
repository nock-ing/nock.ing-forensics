import React from "react";

export type SidebarItem = {
    title: string,
    url: string,
    icon: React.FC<React.SVGProps<SVGSVGElement>>,
}

export type SidebarItems = SidebarItem[];

export type User = {
    id: number,
    username: string,
    email: string,
}