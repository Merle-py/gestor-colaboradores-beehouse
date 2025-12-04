'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DonutSegment {
    label: string
    value: number
    color: string
}

interface KPIDonutChartProps {
    title: string
    subtitle?: string
    data: DonutSegment[]
    size?: number
    strokeWidth?: number
    showLegend?: boolean
    showTotal?: boolean
    totalLabel?: string
    className?: string
}

export function KPIDonutChart({
    title,
    subtitle,
    data,
    size = 160,
    strokeWidth = 24,
    showLegend = true,
    showTotal = true,
    totalLabel = 'Total',
    className,
}: KPIDonutChartProps) {
    const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data])
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const center = size / 2

    const segments = useMemo(() => {
        let currentOffset = 0
        return data.map((segment) => {
            const percentage = total > 0 ? segment.value / total : 0
            const length = circumference * percentage
            const offset = currentOffset
            currentOffset += length
            return {
                ...segment,
                percentage,
                length,
                offset,
            }
        })
    }, [data, total, circumference])

    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-lg p-6', className)}>
            <div className="mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center justify-center">
                <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth={strokeWidth}
                        />
                        {/* Data segments */}
                        {segments.map((segment, index) => (
                            <circle
                                key={index}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                                strokeDashoffset={-segment.offset}
                                strokeLinecap="round"
                                className={cn('transition-all duration-700', segment.color)}
                                style={{ color: 'currentColor' }}
                            />
                        ))}
                    </svg>
                    {/* Center text */}
                    {showTotal && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-gray-900">{total}</span>
                            <span className="text-xs text-gray-500">{totalLabel}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', segment.color)} />
                                <span className="text-sm text-gray-600">{segment.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{segment.value}</span>
                                <span className="text-xs text-gray-400">
                                    ({Math.round(segment.percentage * 100)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Simple progress ring variant
interface ProgressRingProps {
    value: number
    max: number
    size?: number
    strokeWidth?: number
    color?: string
    label?: string
    className?: string
}

export function ProgressRing({
    value,
    max,
    size = 80,
    strokeWidth = 8,
    color = 'text-primary-500',
    label,
    className,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const percentage = max > 0 ? value / max : 0
    const strokeDashoffset = circumference - (circumference * percentage)

    return (
        <div className={cn('inline-flex flex-col items-center', className)}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={cn('transition-all duration-700', color)}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{Math.round(percentage * 100)}%</span>
                </div>
            </div>
            {label && <span className="text-xs text-gray-500 mt-2">{label}</span>}
        </div>
    )
}
