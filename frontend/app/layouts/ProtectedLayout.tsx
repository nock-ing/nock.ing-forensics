'use client'

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/SideBar";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="protected-layout">
                {/* Add your protected layout components here (e.g., sidebar, nav) */}
                <SidebarProvider>
                    <AppSidebar/>
                    <main>
                        <SidebarTrigger/>
                        {children}
                    </main>
                </SidebarProvider>
            </div>
        </ProtectedRoute>
    )
} 