'use client'

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/SideBar";
import { usePathname } from 'next/navigation';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const url = usePathname();
    let isDashboard = false;
    if (url === "/dashboard") {
        isDashboard = true;
    }

    return (
        <ProtectedRoute>
            <div className="protected-layout">
                {/* Add your protected layout components here (e.g., sidebar, nav) */}
                {
                    !isDashboard ? (
                        <SidebarProvider>
                            <AppSidebar/>
                            <main className={"border-border"}>
                                <SidebarTrigger/>
                                {children}
                            </main>
                        </SidebarProvider>
                    ): (
                        <main>
                            {children}
                        </main>
                    )
                }
            </div>
        </ProtectedRoute>
    )
} 