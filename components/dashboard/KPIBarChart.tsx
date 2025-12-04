'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface BarChartData {
    label: string
    value: number
    color?: string
}

interface KPIBarChartProps {
    title: string
    subtitle?: string
    data: BarChartData[]
    maxValue?: number
    showLegend?: boolean
    className?: string
}

const defaultColors = [
    'bg-primary-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
]

export function KPIBarChart({
    title,
    subtitle,
    data,
    maxValue,
    showLegend = true,
    className
}: KPIBarChartProps) {
    const calculatedMax = useMemo(() => {
        if (maxValue) return maxValue
        const max = Math.max(...data.map(d => d.value))
        return Math.ceil(max * 1.1) // Add 10% padding
    }, [data, maxValue])

    const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data])

    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-lg p-6', className)}>
            <div className="mb-6">
                <h3 className="font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>

            <div className="space-y-4">
                {data.map((item, index) => {
                    const percentage = calculatedMax > 0 ? (item.value / calculatedMax) * 100 : 0
                    const color = item.color || defaultColors[index % defaultColors.length]

                    return (
                        <div key={item.label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">{item.label}</span>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-500', color)}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {showLegend && total > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-lg font-extrabold text-gray-900">{total}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// Horizontal stacked bar for comparison
interface StackedBarData {
    label: string
    segments: { value: number; color: string; label: string }[]
}

interface KPIStackedBarProps {
    title: string
    data: StackedBarData[]
    className?: string
}

export function KPIStackedBar({ title, data, className }: KPIStackedBarProps) {
    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-lg p-6', className)}>
            <h3 className="font-bold text-gray-900 mb-6">{title}</h3>

            <div className="space-y-6">
                {data.map((row) => {
                    const total = row.segments.reduce((acc, s) => acc + s.value, 0)

                    return (
                        <div key={row.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">{row.label}</span>
                                <span className="font-bold text-gray-900">{total}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                {row.segments.map((segment, i) => {
                                    const percentage = total > 0 ? (segment.value / total) * 100 : 0
                                    return (
                                        <div
                                            key={i}
                                            className={cn('h-full transition-all duration-500', segment.color)}
                                            style={{ width: `${percentage}%` }}
                                            title={`${segment.label}: ${segment.value}`}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
