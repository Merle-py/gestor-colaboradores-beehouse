'use client'

import { Suspense } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { Loader2 } from 'lucide-react'

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        }>
            <AuthWrapper>
                <DashboardLayout>{children}</DashboardLayout>
            </AuthWrapper>
        </Suspense>
    )
}
