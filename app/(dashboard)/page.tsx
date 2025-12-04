'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    FileWarning,
    Clock,
    AlertTriangle,
    Package,
    Plus,
    RefreshCw,
    TrendingUp,
    Users,
    FileText,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertCardCompact,
    PendingActionsTable,
    KPIBarChart,
    KPIDonutChart
} from '@/components/dashboard'
import { createClient } from '@/lib/supabase/client'
import type {
    CriticalAlert,
    PendingAction,
    ContractExpiringSoon,
    RecessExpiringSoon,
    EPICAExpiring,
    ItemLowStock
} from '@/types/database.types'

export default function DashboardPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [alerts, setAlerts] = useState<{
        contracts: ContractExpiringSoon[]
        recesses: RecessExpiringSoon[]
        epis: EPICAExpiring[]
        lowStock: ItemLowStock[]
    }>({ contracts: [], recesses: [], epis: [], lowStock: [] })
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
    const [stats, setStats] = useState({
        totalCollaborators: 0,
        activeContracts: 0,
        pendingDocuments: 0,
        pendingRecesses: 0,
    })

    const fetchDashboardData = async () => {
        setLoading(true)

        try {
            // Fetch alerts from views
            const [contractsRes, recessesRes, episRes, lowStockRes] = await Promise.all([
                supabase.from('contracts_expiring_soon').select('*'),
                supabase.from('recesses_expiring_soon').select('*'),
                supabase.from('epis_ca_expiring').select('*'),
                supabase.from('items_low_stock').select('*'),
            ])

            setAlerts({
                contracts: (contractsRes.data || []) as ContractExpiringSoon[],
                recesses: (recessesRes.data || []) as RecessExpiringSoon[],
                epis: (episRes.data || []) as EPICAExpiring[],
                lowStock: (lowStockRes.data || []) as ItemLowStock[],
            })

            // Fetch pending actions
            const { data: actions } = await supabase
                .from('pending_actions')
                .select('*, collaborator:collaborators(*)')
                .neq('status', 'completed')
                .order('priority', { ascending: false })
                .limit(10)

            setPendingActions((actions || []) as PendingAction[])

            // Fetch stats
            const [collabRes, contractRes, docsRes, recessRes] = await Promise.all([
                supabase.from('collaborators').select('id', { count: 'exact', head: true }),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('collaborator_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('recess_requests').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
            ])

            setStats({
                totalCollaborators: collabRes.count || 0,
                activeContracts: contractRes.count || 0,
                pendingDocuments: docsRes.count || 0,
                pendingRecesses: recessRes.count || 0,
            })

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Calculate total critical alerts
    const criticalCount = alerts.contracts.filter(c => c.severity === 'critical').length +
        alerts.epis.filter(e => e.severity === 'critical').length

    const warningCount = alerts.contracts.filter(c => c.severity === 'warning').length +
        alerts.recesses.filter(r => r.severity === 'warning').length +
        alerts.epis.filter(e => e.severity === 'warning').length

    // Chart data for contracts expiring
    const contractChartData = [
        { label: 'Jan', value: 2 },
        { label: 'Fev', value: 5 },
        { label: 'Mar', value: 3 },
        { label: 'Abr', value: 8 },
        { label: 'Mai', value: 4 },
        { label: 'Jun', value: 6 },
    ]

    // Donut chart data for work distribution
    const workDistributionData = [
        { label: 'CLT', value: 45, color: 'text-blue-500' },
        { label: 'PJ', value: 30, color: 'text-purple-500' },
        { label: 'Estagiário', value: 15, color: 'text-green-500' },
        { label: 'Temporário', value: 10, color: 'text-orange-500' },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Visão geral do RH e alertas importantes.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchDashboardData}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/colaboradores/novo">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Admissão
                        </Button>
                    </Link>
                    <Link href="/materiais/entregas">
                        <Button variant="outline">
                            <Package className="w-4 h-4 mr-2" />
                            Lançar Material
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Section 1: Critical Alerts (Full Width) */}
            <section>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Alertas Críticos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AlertCardCompact
                        title="Contratos Vencendo"
                        count={alerts.contracts.length}
                        severity={alerts.contracts.some(c => c.severity === 'critical') ? 'critical' : 'warning'}
                        icon={<FileWarning className="w-6 h-6 text-red-600" />}
                    />
                    <AlertCardCompact
                        title="Recessos Finalizando"
                        count={alerts.recesses.length}
                        severity={alerts.recesses.some(r => r.severity === 'critical') ? 'critical' : 'warning'}
                        icon={<Clock className="w-6 h-6 text-amber-600" />}
                    />
                    <AlertCardCompact
                        title="EPIs com CA Vencendo"
                        count={alerts.epis.length}
                        severity={alerts.epis.some(e => e.severity === 'critical') ? 'critical' : 'warning'}
                        icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
                    />
                    <AlertCardCompact
                        title="Estoque Baixo"
                        count={alerts.lowStock.length}
                        severity={alerts.lowStock.some(i => i.severity === 'critical') ? 'critical' : 'info'}
                        icon={<Package className="w-6 h-6 text-blue-600" />}
                    />
                </div>
            </section>

            {/* Section 2 & 3: Pending Actions + KPIs (2/3 + 1/3) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Actions Table (2/3) */}
                <div className="lg:col-span-2">
                    <PendingActionsTable
                        actions={pendingActions}
                        loading={loading}
                        maxRows={8}
                    />
                </div>

                {/* KPIs (1/3) */}
                <div className="space-y-6">
                    <KPIBarChart
                        title="Vencimento de Contratos"
                        subtitle="Próximos 6 meses"
                        data={contractChartData}
                    />

                    <KPIDonutChart
                        title="Distribuição de Trabalho"
                        subtitle="Por tipo de contrato"
                        data={workDistributionData}
                        totalLabel="Colaboradores"
                    />
                </div>
            </section>

            {/* Quick Stats */}
            <section>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Resumo Geral
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-50">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.totalCollaborators}</p>
                                <p className="text-xs text-gray-500">Colaboradores</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-50">
                                <Briefcase className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.activeContracts}</p>
                                <p className="text-xs text-gray-500">Contratos Ativos</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-50">
                                <FileText className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.pendingDocuments}</p>
                                <p className="text-xs text-gray-500">Docs Pendentes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-50">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.pendingRecesses}</p>
                                <p className="text-xs text-gray-500">Recessos Pendentes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
