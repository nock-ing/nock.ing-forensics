import {Home, Inbox, Cross, Settings} from "lucide-react";
import {SidebarItems} from "@/components/SideBar/sidebar.types";

export const items: SidebarItems = [
    {
        title: "Home",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Forensics",
        url: "/forensics",
        icon: Inbox,
    },
    {
        title: "Health",
        url: "/health",
        icon: Cross,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

