'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Download,
    FileText,
    BarChart3,
    Table,
    Calendar,
    Loader2,
    CheckCircle,
    TrendingUp,
    Users,
    DollarSign,
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

interface ReportData {
    totalCollaborators: number
    totalPJ: number
    totalCLT: number
    totalMaterials: number
    departments: { name: string; cost: number; count: number }[]
    monthlyTrend: { month: string; value: number }[]
}

export default function RelatoriosPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [reportType, setReportType] = useState('monthly')
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [data, setData] = useState<ReportData>({
        totalCollaborators: 0,
        totalPJ: 0,
        totalCLT: 0,
        totalMaterials: 0,
        departments: [],
        monthlyTrend: [],
    })
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)

        const { data: contracts } = await (supabase.from('contracts') as any)
            .select('*, collaborator:collaborators(full_name, department)')
            .eq('status', 'active')

        if (contracts) {
            const pjTotal = contracts
                .filter((c: any) => c.contract_type === 'PJ')
                .reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0)

            const cltTotal = contracts
                .filter((c: any) => c.contract_type === 'CLT')
                .reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0)

            // Group by department
            const deptMap: Record<string, { cost: number; count: number }> = {}
            contracts.forEach((c: any) => {
                const dept = c.collaborator?.department || 'Sem Departamento'
                if (!deptMap[dept]) {
                    deptMap[dept] = { cost: 0, count: 0 }
                }
                deptMap[dept].cost += c.monthly_value || 0
                deptMap[dept].count++
            })

            const departments = Object.entries(deptMap).map(([name, d]) => ({
                name,
                cost: d.cost,
                count: d.count,
            })).sort((a, b) => b.cost - a.cost)

            // Mock monthly trend
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
            const baseValue = pjTotal + cltTotal
            const monthlyTrend = months.map(month => ({
                month,
                value: baseValue * (0.85 + Math.random() * 0.3),
            }))

            setData({
                totalCollaborators: contracts.length,
                totalPJ: pjTotal,
                totalCLT: cltTotal,
                totalMaterials: 0,
                departments,
                monthlyTrend,
            })
        }

        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const handleExport = async (format: 'csv' | 'pdf') => {
        setExporting(true)

        // Simulate export delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        if (format === 'csv') {
            // Create CSV content
            let csv = 'Departamento,Colaboradores,Custo Total\n'
            data.departments.forEach(dept => {
                csv += `${dept.name},${dept.count},${dept.cost}\n`
            })
            csv += `\nTotal,${data.totalCollaborators},${data.totalPJ + data.totalCLT}\n`

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `relatorio-financeiro-${period}.csv`
            link.click()
        }

        setExporting(false)
    }

    const getReportTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            monthly: 'Relatório Mensal',
            quarterly: 'Relatório Trimestral',
            annual: 'Relatório Anual',
            department: 'Por Departamento',
        }
        return labels[type] || type
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/financeiro">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
                    <p className="text-gray-500 text-sm">Gere e exporte relatórios de custos</p>
                </div>
            </div>

            {/* Report Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Relatório</CardTitle>
                    <CardDescription>Selecione o tipo e período do relatório</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Relatório</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Relatório Mensal</SelectItem>
                                    <SelectItem value="quarterly">Relatório Trimestral</SelectItem>
                                    <SelectItem value="annual">Relatório Anual</SelectItem>
                                    <SelectItem value="department">Por Departamento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Período</label>
                            <input
                                type="month"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Exportar</label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleExport('csv')}
                                    disabled={exporting}
                                >
                                    {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Table className="w-4 h-4 mr-2" />}
                                    CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleExport('pdf')}
                                    disabled={exporting}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-500" />
                            {getReportTypeLabel(reportType)}
                        </CardTitle>
                        <CardDescription>
                            Período: {new Date(period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </CardDescription>
                    </div>
                    <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Atualizado
                    </Badge>
                </CardHeader>
                <CardContent>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-primary-50 rounded-xl text-center">
                            <DollarSign className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-primary-700">{formatCurrency(data.totalPJ + data.totalCLT)}</p>
                            <p className="text-xs text-primary-600">Custo Total</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(data.totalPJ)}</p>
                            <p className="text-xs text-green-600">Total PJ</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl text-center">
                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(data.totalCLT)}</p>
                            <p className="text-xs text-blue-600">Total CLT</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl text-center">
                            <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-amber-700">{data.totalCollaborators}</p>
                            <p className="text-xs text-amber-600">Colaboradores</p>
                        </div>
                    </div>

                    {/* Department Table */}
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Departamento
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Colaboradores
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Custo Total
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Custo Médio
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.departments.map((dept) => (
                                    <tr key={dept.name} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {dept.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {dept.count}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                            {formatCurrency(dept.cost)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                            {formatCurrency(dept.cost / dept.count)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                        Total
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-center">
                                        {data.totalCollaborators}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(data.totalPJ + data.totalCLT)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency((data.totalPJ + data.totalCLT) / Math.max(data.totalCollaborators, 1))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Trend Chart */}
                    <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Evolução Mensal</h3>
                        <div className="h-48 flex items-end justify-between gap-2">
                            {data.monthlyTrend.map((item) => {
                                const maxValue = Math.max(...data.monthlyTrend.map(d => d.value))
                                const height = (item.value / maxValue) * 100
                                return (
                                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="text-xs font-medium text-gray-700">{formatCurrency(item.value)}</div>
                                        <div
                                            className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg"
                                            style={{ height: `${height}%`, minHeight: '20px' }}
                                        />
                                        <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-gray-500" />
                        Relatórios Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">relatorio-mensal-nov-2024.csv</p>
                                    <p className="text-xs text-gray-500">Exportado em {new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">relatorio-departamentos-out-2024.pdf</p>
                                    <p className="text-xs text-gray-500">Exportado em 01/11/2024</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
