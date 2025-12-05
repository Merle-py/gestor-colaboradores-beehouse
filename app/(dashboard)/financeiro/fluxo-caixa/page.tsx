'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    BarChart3,
    Receipt,
    CreditCard,
    Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface CashFlowData {
    month: string
    entradas: number
    saidas: number
    saldo: number
}

export default function FluxoCaixaPage() {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('6')
    const [data, setData] = useState<CashFlowData[]>([])
    const [totals, setTotals] = useState({
        entradas: 0,
        saidas: 0,
        saldo: 0,
    })

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token')
            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch contracts for income
            const contractsRes = await fetch('/api/contracts', { headers })
            const contractsData = await contractsRes.json()

            // Fetch bills for expenses
            const billsRes = await fetch('/api/bills', { headers })
            const billsData = await billsRes.json()

            // Calculate monthly data
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            const currentMonth = new Date().getMonth()
            const numMonths = parseInt(period)

            const activeContracts = contractsData.data?.filter((c: any) => c.status === 'active') || []
            const monthlyPayroll = activeContracts.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0)

            const cashFlow: CashFlowData[] = []
            let totalEntradas = 0
            let totalSaidas = 0

            for (let i = numMonths - 1; i >= 0; i--) {
                const monthIndex = (currentMonth - i + 12) % 12
                const monthName = months[monthIndex]

                // Calculate bills for this month
                const monthBills = billsData.data?.filter((b: any) => {
                    const billDate = new Date(b.due_date)
                    return billDate.getMonth() === monthIndex
                }) || []

                const monthExpenses = monthBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)

                // Simulate some variation in income (baseado em estimativas)
                const variation = 0.9 + Math.random() * 0.2
                const entradas = i === 0 ? monthlyPayroll * 1.5 : monthlyPayroll * 1.5 * variation
                const saidas = i === 0 ? monthlyPayroll + monthExpenses : (monthlyPayroll + monthExpenses) * variation

                totalEntradas += entradas
                totalSaidas += saidas

                cashFlow.push({
                    month: monthName,
                    entradas,
                    saidas,
                    saldo: entradas - saidas,
                })
            }

            setData(cashFlow)
            setTotals({
                entradas: totalEntradas,
                saidas: totalSaidas,
                saldo: totalEntradas - totalSaidas,
            })
        } catch (error) {
            console.error('Error fetching data:', error)
        }
        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const maxValue = Math.max(...data.map(d => Math.max(d.entradas, d.saidas)), 1)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fluxo de Caixa</h1>
                    <p className="text-gray-500 mt-1">Visualização de entradas e saídas</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-40">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">Últimos 3 meses</SelectItem>
                        <SelectItem value="6">Últimos 6 meses</SelectItem>
                        <SelectItem value="12">Últimos 12 meses</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
                <Link href="/financeiro" className="flex-1 min-w-[120px]">
                    <Button variant="ghost" className="w-full hover:bg-white/50">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Visão Geral
                    </Button>
                </Link>
                <Link href="/financeiro/kanban" className="flex-1 min-w-[120px]">
                    <Button variant="ghost" className="w-full hover:bg-white/50">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Kanban
                    </Button>
                </Link>
                <Link href="/financeiro/fluxo-caixa" className="flex-1 min-w-[120px]">
                    <Button
                        variant="ghost"
                        className="w-full bg-white shadow-sm text-gray-900 font-semibold"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Fluxo de Caixa
                    </Button>
                </Link>
                <Link href="/financeiro/relatorios" className="flex-1 min-w-[120px]">
                    <Button variant="ghost" className="w-full hover:bg-white/50">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Relatórios
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Entradas</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(totals.entradas)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Total Saídas</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(totals.saidas)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <ArrowDownRight className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`bg-gradient-to-br ${totals.saldo >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white border-0`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Saldo do Período</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(totals.saldo)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        Gráfico de Fluxo de Caixa
                    </CardTitle>
                    <CardDescription>Comparativo de entradas e saídas por mês</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded" />
                            <span className="text-sm text-gray-600">Entradas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded" />
                            <span className="text-sm text-gray-600">Saídas</span>
                        </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="space-y-4">
                        {data.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium w-12">{item.month}</span>
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex-1 flex gap-1">
                                            {/* Entradas bar */}
                                            <div
                                                className="h-8 bg-green-500 rounded-l flex items-center justify-end pr-2 text-white text-xs font-medium transition-all"
                                                style={{ width: `${(item.entradas / maxValue) * 50}%` }}
                                            >
                                                {formatCurrency(item.entradas)}
                                            </div>
                                            {/* Saídas bar */}
                                            <div
                                                className="h-8 bg-red-500 rounded-r flex items-center pl-2 text-white text-xs font-medium transition-all"
                                                style={{ width: `${(item.saidas / maxValue) * 50}%` }}
                                            >
                                                {formatCurrency(item.saidas)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={item.saldo >= 0 ? 'success' : 'error'}
                                        className="w-28 justify-center"
                                    >
                                        {item.saldo >= 0 ? '+' : ''}{formatCurrency(item.saldo)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mês</th>
                                    <th className="text-right py-3 px-4 font-semibold text-green-600">Entradas</th>
                                    <th className="text-right py-3 px-4 font-semibold text-red-600">Saídas</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{item.month}</td>
                                        <td className="py-3 px-4 text-right text-green-600">{formatCurrency(item.entradas)}</td>
                                        <td className="py-3 px-4 text-right text-red-600">{formatCurrency(item.saidas)}</td>
                                        <td className={`py-3 px-4 text-right font-semibold ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.saldo)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td className="py-3 px-4">TOTAL</td>
                                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totals.entradas)}</td>
                                    <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totals.saidas)}</td>
                                    <td className={`py-3 px-4 text-right ${totals.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(totals.saldo)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
