'use client'

import { AlertTriangle, Clock, FileWarning, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CriticalAlert, AlertSeverity } from '@/types/database.types'

interface AlertCardProps {
    alert: CriticalAlert
    onClick?: () => void
}

const severityConfig: Record<AlertSeverity, { bg: string; border: string; icon: string; text: string }> = {
    critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-800',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        text: 'text-amber-800',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-800',
    },
}

const typeIcon = {
    contract_expiring: FileWarning,
    recess_expiring: Clock,
    epi_ca_expiring: AlertTriangle,
    low_stock: Package,
    epi_replacement: AlertTriangle,
}

export function AlertCard({ alert, onClick }: AlertCardProps) {
    const config = severityConfig[alert.severity]
    const Icon = typeIcon[alert.type] || AlertTriangle

    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]',
                config.bg,
                config.border
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={cn('font-bold text-sm', config.text)}>{alert.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full',
                            alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                alert.severity === 'warning' ? 'bg-amber-200 text-amber-800' :
                                    'bg-blue-200 text-blue-800'
                        )}>
                            {alert.days_remaining <= 0 ? 'VENCIDO' : `${alert.days_remaining} dias`}
                        </span>
                        <span className="text-xs text-gray-500">{alert.module}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Compact version for grid display
interface AlertCardCompactProps {
    title: string
    count: number
    severity: AlertSeverity
    icon: React.ReactNode
    onClick?: () => void
}

export function AlertCardCompact({ title, count, severity, icon, onClick }: AlertCardCompactProps) {
    const config = severityConfig[severity]

    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-xl border-2 p-5 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02]',
                config.bg,
                config.border
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <p className={cn('text-3xl font-extrabold mt-1', config.text)}>{count}</p>
                </div>
                <div className={cn('p-3 rounded-xl', config.bg, 'bg-opacity-50')}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
