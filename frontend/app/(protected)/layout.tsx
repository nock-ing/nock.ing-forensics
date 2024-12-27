import ProtectedLayout from '@/app/layouts/ProtectedLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ProtectedLayout>{children}</ProtectedLayout>
}
