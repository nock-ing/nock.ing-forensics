'use client'

import { ProtectedRoute } from "@/app/components/ProtectedRoute"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="protected-layout">
                {/* Add your protected layout components here (e.g., sidebar, nav) */}
                <main>{children}</main>
            </div>
        </ProtectedRoute>
    )
} 