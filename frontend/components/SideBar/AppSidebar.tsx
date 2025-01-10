'use client';

import Image from "next/image";
import { ChevronUp, User2 } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { items } from "@/components/SideBar/menuitems";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {useUser} from "@/hooks/use-user";
import Link from "next/link";

export function AppSidebar() {
    const { user, loading, error, signOut } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <Sidebar
            variant="floating"
            collapsible="icon"
        >
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex justify-between align-center">
                        <Image
                            src="/nock.ing.png"
                            alt="Nock.ing Logo"
                            width={120}
                            height={20}
                        />
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <div className="flex justify-between items-center">
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton>
                                        <User2 /> {user.username}
                                        <ChevronUp className="ml-auto" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="top"
                                    className="w-[--radix-popper-anchor-width]"
                                >
                                    <Link href={"/account"}>
                                    <DropdownMenuItem>
                                            Account
                                    </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem onClick={signOut}>
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                        <DarkModeToggle />
                    </div>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

