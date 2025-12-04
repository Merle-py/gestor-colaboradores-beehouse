'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    FileText,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Receipt,
    PiggyBank,
    Wallet,
    BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface FinancialStats {
    totalPJ: number
    totalCLT: number
    totalMaterials: number
    pendingPayments: number
    pjCount: number
    cltCount: number
}

interface RecentPayment {
    id: string
    collaborator_name: string
    payment_type: string
    value: number
    status: string
    due_date: string
}

export default function FinanceiroPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<FinancialStats>({
        totalPJ: 0,
        totalCLT: 0,
        totalMaterials: 0,
        pendingPayments: 0,
        pjCount: 0,
        cltCount: 0,
    })
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
    const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch contracts for financial calculations
        const { data: contracts } = await (supabase.from('contracts') as any)
            .select('*, collaborator:collaborators(full_name)')
            .eq('status', 'active')

        if (contracts) {
            const pjContracts = contracts.filter((c: any) => c.contract_type === 'PJ')
            const cltContracts = contracts.filter((c: any) => c.contract_type === 'CLT')

            const totalPJ = pjContracts.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0)
            const totalCLT = cltContracts.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0)

            // Fetch materials cost (from movements)
            const { data: movements } = await (supabase.from('inventory_movements') as any)
                .select('quantity, unit_cost')
                .eq('movement_type', 'entry')

            const totalMaterials = movements?.reduce((sum: number, m: any) =>
                sum + (m.quantity * (m.unit_cost || 0)), 0) || 0

            setStats({
                totalPJ,
                totalCLT,
                totalMaterials,
                pendingPayments: pjContracts.length, // PJ contracts need monthly payment
                pjCount: pjContracts.length,
                cltCount: cltContracts.length,
            })

            // Create mock recent payments from PJ contracts
            const mockPayments: RecentPayment[] = pjContracts.slice(0, 5).map((c: any) => ({
                id: c.id,
                collaborator_name: c.collaborator?.full_name || 'N/A',
                payment_type: 'NF PJ',
                value: c.monthly_value || 0,
                status: 'pending',
                due_date: new Date().toISOString().split('T')[0],
            }))
            setRecentPayments(mockPayments)

            // Generate mock monthly data for chart
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
            const baseValue = totalPJ + totalCLT
            setMonthlyData(months.map((month, i) => ({
                month,
                value: baseValue * (0.9 + Math.random() * 0.2),
            })))
        }

        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
            paid: { label: 'Pago', variant: 'success' },
            pending: { label: 'Pendente', variant: 'warning' },
            overdue: { label: 'Atrasado', variant: 'error' },
            scheduled: { label: 'Agendado', variant: 'neutral' },
        }
        const c = config[status] || { label: status, variant: 'neutral' }
        return <Badge variant={c.variant}>{c.label}</Badge>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    const totalGeral = stats.totalPJ + stats.totalCLT + stats.totalMaterials

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financeiro</h1>
                    <p className="text-gray-500 mt-1">Gestão financeira e controle de custos</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/financeiro/pagamentos">
                        <Button variant="outline">
                            <Receipt className="w-4 h-4 mr-2" />
                            Pagamentos
                        </Button>
                    </Link>
                    <Link href="/financeiro/relatorios">
                        <Button>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Relatórios
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Geral */}
                <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 text-sm font-medium">Custo Total Mensal</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(totalGeral)}</p>
                                <p className="text-primary-200 text-xs mt-2">{stats.pjCount + stats.cltCount} colaboradores ativos</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Wallet className="w-8 h-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PJ */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Contratos PJ</p>
                                <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.totalPJ)}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Users className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{stats.pjCount} prestadores</span>
                                </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CLT */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Folha CLT</p>
                                <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.totalCLT)}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Users className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{stats.cltCount} funcionários</span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Materiais */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Custo Materiais</p>
                                <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.totalMaterials)}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingDown className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs text-gray-500">EPIs e materiais</span>
                                </div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <CreditCard className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-500" />
                            Evolução de Custos
                        </CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end justify-between gap-2 px-4">
                            {monthlyData.map((data, index) => {
                                const maxValue = Math.max(...monthlyData.map(d => d.value))
                                const height = (data.value / maxValue) * 100
                                return (
                                    <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-500"
                                            style={{ height: `${height}%`, minHeight: '20px' }}
                                        />
                                        <span className="text-xs text-gray-500 font-medium">{data.month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Resumo Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-700 font-medium">Pagamentos Pendentes</p>
                                    <p className="text-2xl font-bold text-amber-800">{stats.pendingPayments}</p>
                                </div>
                                <Receipt className="w-8 h-8 text-amber-500" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Custo por colaborador</span>
                                <span className="font-bold text-gray-900">
                                    {formatCurrency(totalGeral / Math.max(stats.pjCount + stats.cltCount, 1))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">% PJ vs CLT</span>
                                <span className="font-bold text-gray-900">
                                    {totalGeral > 0 ? Math.round((stats.totalPJ / totalGeral) * 100) : 0}% / {totalGeral > 0 ? Math.round((stats.totalCLT / totalGeral) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            Pagamentos Recentes
                        </CardTitle>
                        <CardDescription>Últimos lançamentos e pendências</CardDescription>
                    </div>
                    <Link href="/financeiro/pagamentos">
                        <Button variant="outline" size="sm">Ver todos</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentPayments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <PiggyBank className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum pagamento registrado</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{payment.collaborator_name}</p>
                                            <p className="text-sm text-gray-500">{payment.payment_type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(payment.value)}</p>
                                            <p className="text-xs text-gray-500">Venc: {new Date(payment.due_date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        {getStatusBadge(payment.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/financeiro/pagamentos" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300 group">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                                <Receipt className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Registrar Pagamento</p>
                                <p className="text-sm text-gray-500">Lançar NF ou pagamento</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/financeiro/custos" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300 group">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Análise de Custos</p>
                                <p className="text-sm text-gray-500">Ver custos por área</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/financeiro/relatorios" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300 group">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Gerar Relatório</p>
                                <p className="text-sm text-gray-500">Exportar dados</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
