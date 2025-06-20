import {Home, Inbox, Cross, Settings, FileSearch, List} from "lucide-react";
import {SidebarItems} from "@/components/SideBar/sidebar.types";

export const items: SidebarItems = [
    {
        title: "Home",
        url: "/dashboard",
        icon: Home,
    },
    /*{
        title: "Investigations",
        url: "/investigations",
        icon: Search,
    },
     */
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
        url: "/account",
        icon: Settings,
    },
    {
        title: "Recent Search",
        url: "/recent-search",
        icon: FileSearch,
    },
    {
        title: "Saved Wallets/Txs",
        url: "/saved",
        icon: List,
    }
]
