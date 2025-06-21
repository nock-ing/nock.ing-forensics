import ProtectedLayout from '@/app/layouts/ProtectedLayout'
import { Toaster } from '@/components/ui/toaster';
import {WalletMonitoringProvider} from "@/providers/WalletMonitoringProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ProtectedLayout><WalletMonitoringProvider>{children}<Toaster /></WalletMonitoringProvider></ProtectedLayout>
}
