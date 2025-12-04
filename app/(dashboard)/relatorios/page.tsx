'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    FileText,
    TrendingDown,
    Package,
    Calendar,
    Users,
    AlertTriangle,
    Download,
    Loader2,
    ChevronRight,
    Building2,
    Briefcase,
    Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface ExpiringContract {
    id: string
    collaborator_name: string
    contract_type: string
    end_date: string
    days_until: number
}

interface TurnoverData {
    department: string
    total: number
    left: number
    turnover_rate: number
}

interface MaterialReport {
    item_name: string
    category: string
    current_stock: number
    deliveries_count: number
    is_low_stock: boolean
}

export default function RelatoriosPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [activeReport, setActiveReport] = useState<string | null>(null)

    // Report data
    const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([])
    const [turnoverData, setTurnoverData] = useState<TurnoverData[]>([])
    const [materialReport, setMaterialReport] = useState<MaterialReport[]>([])

    useEffect(() => {
        fetchAllReports()
    }, [])

    const fetchAllReports = async () => {
        setLoading(true)
        await Promise.all([
            fetchExpiringContracts(),
            fetchTurnover(),
            fetchMaterialReport(),
        ])
        setLoading(false)
    }

    const fetchExpiringContracts = async () => {
        const today = new Date().toISOString().split('T')[0]
        const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data } = await supabase
            .from('contracts')
            .select('*, collaborator:collaborators(full_name)')
            .eq('status', 'active')
            .gte('end_date', today)
            .lte('end_date', next30)
            .order('end_date')

        if (data) {
            setExpiringContracts(data.map((c: any) => ({
                id: c.id,
                collaborator_name: c.collaborator?.full_name || 'N/A',
                contract_type: c.contract_type,
                end_date: c.end_date,
                days_until: Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            })))
        }
    }

    const fetchTurnover = async () => {
        // Get all collaborators grouped by department
        const { data: all } = await supabase
            .from('collaborators')
            .select('department, status')

        if (all) {
            const deptStats: Record<string, { total: number; left: number }> = {}

            all.forEach((c: any) => {
                const dept = c.department || 'Sem departamento'
                if (!deptStats[dept]) deptStats[dept] = { total: 0, left: 0 }
                deptStats[dept].total++
                if (c.status === 'desligado') deptStats[dept].left++
            })

            setTurnoverData(Object.entries(deptStats).map(([dept, stats]) => ({
                department: dept,
                total: stats.total,
                left: stats.left,
                turnover_rate: stats.total > 0 ? (stats.left / stats.total) * 100 : 0,
            })).sort((a, b) => b.turnover_rate - a.turnover_rate))
        }
    }

    const fetchMaterialReport = async () => {
        const { data } = await supabase
            .from('inventory_items')
            .select('id, name, category, current_stock, minimum_stock')
            .eq('is_active', true)

        // Get delivery counts
        const { data: deliveries } = await supabase
            .from('epi_deliveries')
            .select('inventory_item_id')

        const deliveryCounts: Record<string, number> = {}
        deliveries?.forEach((d: any) => {
            deliveryCounts[d.inventory_item_id] = (deliveryCounts[d.inventory_item_id] || 0) + 1
        })

        if (data) {
            setMaterialReport(data.map((item: any) => ({
                item_name: item.name,
                category: item.category,
                current_stock: item.current_stock,
                deliveries_count: deliveryCounts[item.id] || 0,
                is_low_stock: item.current_stock <= item.minimum_stock,
            })).sort((a, b) => b.deliveries_count - a.deliveries_count))
        }
    }

    const reports = [
        {
            id: 'contracts',
            title: 'Vencimento Contratual',
            description: 'Contratos PJ a vencer nos próximos 30 dias',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            count: expiringContracts.length,
        },
        {
            id: 'turnover',
            title: 'Turnover / Rotatividade',
            description: 'Índice de rotatividade por departamento',
            icon: TrendingDown,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            count: turnoverData.length,
        },
        {
            id: 'materials',
            title: 'Materiais e EPIs',
            description: 'Consumo e estoque de materiais',
            icon: Package,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            count: materialReport.length,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
                <p className="text-gray-500 mt-1">Visualize dados e métricas do RH</p>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reports.map((report) => {
                    const Icon = report.icon
                    const isActive = activeReport === report.id

                    return (
                        <Card
                            key={report.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-primary-500' : ''
                                }`}
                            onClick={() => setActiveReport(isActive ? null : report.id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${report.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${report.color}`} />
                                    </div>
                                    <Badge variant="neutral">{report.count}</Badge>
                                </div>
                                <h3 className="font-bold text-gray-900 mt-4">{report.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                                    {isActive ? 'Fechar' : 'Ver detalhes'}
                                    <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Report Details */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
            ) : (
                <>
                    {/* Expiring Contracts */}
                    {activeReport === 'contracts' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Contratos a Vencer (30 dias)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expiringContracts.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">Nenhum contrato expirando</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left p-4 text-sm font-medium text-gray-600">Colaborador</th>
                                                    <th className="text-left p-4 text-sm font-medium text-gray-600">Tipo</th>
                                                    <th className="text-left p-4 text-sm font-medium text-gray-600">Vencimento</th>
                                                    <th className="text-left p-4 text-sm font-medium text-gray-600">Dias</th>
                                                    <th className="text-left p-4 text-sm font-medium text-gray-600">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {expiringContracts.map((c) => (
                                                    <tr key={c.id} className="hover:bg-gray-50">
                                                        <td className="p-4 font-medium">{c.collaborator_name}</td>
                                                        <td className="p-4">
                                                            <Badge variant="neutral">{c.contract_type}</Badge>
                                                        </td>
                                                        <td className="p-4">{new Date(c.end_date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-4">
                                                            <Badge variant={c.days_until <= 7 ? 'error' : c.days_until <= 15 ? 'warning' : 'neutral'}>
                                                                {c.days_until} dias
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <Link href={`/contratos/${c.id}`}>
                                                                <Button size="sm" variant="outline">Renovar</Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Turnover */}
                    {activeReport === 'turnover' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-amber-600" />
                                    Rotatividade por Departamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {turnoverData.map((dept) => (
                                        <div key={dept.department} className="flex items-center gap-4">
                                            <div className="w-40 font-medium">{dept.department}</div>
                                            <div className="flex-1">
                                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${dept.turnover_rate > 20 ? 'bg-red-500' :
                                                                dept.turnover_rate > 10 ? 'bg-amber-500' :
                                                                    'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(dept.turnover_rate, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-24 text-right">
                                                <span className="font-bold">{dept.turnover_rate.toFixed(1)}%</span>
                                                <span className="text-xs text-gray-500 ml-1">({dept.left}/{dept.total})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Materials */}
                    {activeReport === 'materials' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-green-600" />
                                    Consumo de Materiais
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-medium text-gray-600">Item</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-600">Categoria</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-600">Estoque</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-600">Entregas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {materialReport.map((item, i) => (
                                                <tr key={i} className={item.is_low_stock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {item.is_low_stock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                            <span className="font-medium">{item.item_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-600">{item.category}</td>
                                                    <td className="p-4">
                                                        <Badge variant={item.is_low_stock ? 'error' : 'success'}>
                                                            {item.current_stock} un.
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-blue-600">{item.deliveries_count}</span>
                                                        <span className="text-gray-500 ml-1">entregas</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Contratos Expirando</p>
                            <p className="text-2xl font-bold text-blue-600">{expiringContracts.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <TrendingDown className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Taxa Média Turnover</p>
                            <p className="text-2xl font-bold text-amber-600">
                                {turnoverData.length > 0
                                    ? (turnoverData.reduce((a, b) => a + b.turnover_rate, 0) / turnoverData.length).toFixed(1)
                                    : 0}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-50">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Itens Baixo Estoque</p>
                            <p className="text-2xl font-bold text-red-600">
                                {materialReport.filter(m => m.is_low_stock).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Entregas</p>
                            <p className="text-2xl font-bold text-green-600">
                                {materialReport.reduce((a, b) => a + b.deliveries_count, 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
