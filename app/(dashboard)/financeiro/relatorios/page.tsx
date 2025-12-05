'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    FileText,
    Download,
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Loader2,
    Filter,
    BarChart3,
    Receipt,
    CreditCard,
    Building2,
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
import { Input } from '@/components/ui/input'

interface ReportData {
    collaborators: any[]
    contracts: any[]
    bills: any[]
    summary: {
        totalCollaborators: number
        totalCLT: number
        totalPJ: number
        totalPayroll: number
        totalBillsPending: number
        totalBillsPaid: number
    }
}

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [data, setData] = useState<ReportData | null>(null)
    const [period, setPeriod] = useState('current')
    const [reportType, setReportType] = useState('payroll')

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token')
            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch collaborators
            const collabRes = await fetch('/api/collaborators', { headers })
            const collabData = await collabRes.json()

            // Fetch contracts
            const contractsRes = await fetch('/api/contracts', { headers })
            const contractsData = await contractsRes.json()

            // Fetch bills
            const billsRes = await fetch('/api/bills', { headers })
            const billsData = await billsRes.json()

            const collaborators = collabData.data || []
            const contracts = contractsData.data || []
            const bills = billsData.data || []

            // Calculate summary
            const activeContracts = contracts.filter((c: any) => c.status === 'active')
            const cltContracts = activeContracts.filter((c: any) => c.contract_type === 'CLT')
            const pjContracts = activeContracts.filter((c: any) => c.contract_type === 'PJ')

            setData({
                collaborators,
                contracts,
                bills,
                summary: {
                    totalCollaborators: collaborators.filter((c: any) => c.status === 'ativo').length,
                    totalCLT: cltContracts.length,
                    totalPJ: pjContracts.length,
                    totalPayroll: activeContracts.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0),
                    totalBillsPending: bills.filter((b: any) => b.status === 'pending' || b.status === 'overdue').reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
                    totalBillsPaid: bills.filter((b: any) => b.status === 'paid').reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
                },
            })
        } catch (error) {
            console.error('Error fetching data:', error)
        }
        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const generatePDF = async (type: string) => {
        setGenerating(true)

        try {
            // Dynamic import for client-side only
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF()
            const today = new Date().toLocaleDateString('pt-BR')

            // Header
            doc.setFontSize(20)
            doc.setTextColor(59, 130, 246)
            doc.text('BEEHOUSE', 14, 20)
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text('Gestão de Colaboradores', 14, 26)
            doc.text(`Gerado em: ${today}`, 14, 32)

            if (type === 'payroll') {
                // Payroll Report
                doc.setFontSize(16)
                doc.setTextColor(0)
                doc.text('Relatório de Folha de Pagamento', 14, 45)

                const activeContracts = data?.contracts.filter((c: any) => c.status === 'active') || []

                const tableData = activeContracts.map((c: any) => [
                    c.collaborator?.full_name || 'N/A',
                    c.contract_type,
                    formatCurrency(c.monthly_value || 0),
                    c.payment_day ? `Dia ${c.payment_day}` : '-',
                ])

                autoTable(doc, {
                    startY: 55,
                    head: [['Colaborador', 'Tipo', 'Valor Mensal', 'Pagamento']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] },
                    footStyles: { fillColor: [229, 231, 235] },
                    foot: [['TOTAL', '', formatCurrency(data?.summary.totalPayroll || 0), '']],
                })

                // Summary
                const finalY = (doc as any).lastAutoTable.finalY + 15
                doc.setFontSize(12)
                doc.text('Resumo:', 14, finalY)
                doc.setFontSize(10)
                doc.text(`CLT: ${data?.summary.totalCLT || 0} colaboradores`, 14, finalY + 8)
                doc.text(`PJ: ${data?.summary.totalPJ || 0} colaboradores`, 14, finalY + 14)

            } else if (type === 'bills') {
                // Bills Report
                doc.setFontSize(16)
                doc.setTextColor(0)
                doc.text('Relatório de Contas a Pagar', 14, 45)

                const pendingBills = data?.bills.filter((b: any) => b.status !== 'paid') || []

                const tableData = pendingBills.map((b: any) => [
                    b.description,
                    b.category || '-',
                    formatCurrency(b.amount || 0),
                    new Date(b.due_date).toLocaleDateString('pt-BR'),
                    b.status === 'overdue' ? 'VENCIDA' : 'Pendente',
                ])

                autoTable(doc, {
                    startY: 55,
                    head: [['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [239, 68, 68] },
                    footStyles: { fillColor: [229, 231, 235] },
                    foot: [['TOTAL PENDENTE', '', formatCurrency(data?.summary.totalBillsPending || 0), '', '']],
                })

            } else if (type === 'collaborators') {
                // Collaborators Report
                doc.setFontSize(16)
                doc.setTextColor(0)
                doc.text('Relatório de Colaboradores', 14, 45)

                const activeCollabs = data?.collaborators.filter((c: any) => c.status === 'ativo') || []

                const tableData = activeCollabs.map((c: any) => [
                    c.full_name,
                    c.department || '-',
                    c.position || '-',
                    c.email,
                ])

                autoTable(doc, {
                    startY: 55,
                    head: [['Nome', 'Departamento', 'Cargo', 'Email']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [34, 197, 94] },
                })

                const finalY = (doc as any).lastAutoTable.finalY + 15
                doc.setFontSize(12)
                doc.text(`Total: ${activeCollabs.length} colaboradores ativos`, 14, finalY)
            }

            // Footer
            const pageCount = doc.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' })
            }

            // Download
            const fileName = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.pdf`
            doc.save(fileName)

        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Erro ao gerar PDF: ' + (error as any).message)
        }

        setGenerating(false)
    }

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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Relatórios</h1>
                    <p className="text-gray-500 mt-1">Gere e exporte relatórios em PDF</p>
                </div>
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
                <Link href="/financeiro/pagamentos" className="flex-1 min-w-[120px]">
                    <Button variant="ghost" className="w-full hover:bg-white/50">
                        <Receipt className="w-4 h-4 mr-2" />
                        Pagamentos
                    </Button>
                </Link>
                <Link href="/financeiro/relatorios" className="flex-1 min-w-[120px]">
                    <Button
                        variant="ghost"
                        className="w-full bg-white shadow-sm text-gray-900 font-semibold"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Relatórios
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-100 rounded-xl">
                                <Users className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Colaboradores</p>
                                <p className="text-2xl font-bold">{data?.summary.totalCollaborators}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Folha Mensal</p>
                                <p className="text-2xl font-bold">{formatCurrency(data?.summary.totalPayroll || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Contas Pendentes</p>
                                <p className="text-2xl font-bold">{formatCurrency(data?.summary.totalBillsPending || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Contas Pagas</p>
                                <p className="text-2xl font-bold">{formatCurrency(data?.summary.totalBillsPaid || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Payroll Report */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-100 rounded-xl">
                                <Receipt className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <CardTitle>Folha de Pagamento</CardTitle>
                                <CardDescription>Relatório mensal de salários</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">CLT:</span>
                                <span className="font-medium">{data?.summary.totalCLT} contratos</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">PJ:</span>
                                <span className="font-medium">{data?.summary.totalPJ} contratos</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-900 font-medium">Total:</span>
                                <span className="font-bold text-primary-600">{formatCurrency(data?.summary.totalPayroll || 0)}</span>
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => generatePDF('payroll')}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Exportar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bills Report */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle>Contas a Pagar</CardTitle>
                                <CardDescription>Contas pendentes e vencidas</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Pendentes:</span>
                                <span className="font-medium">{data?.bills.filter((b: any) => b.status === 'pending').length || 0} contas</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Vencidas:</span>
                                <span className="font-medium text-red-600">{data?.bills.filter((b: any) => b.status === 'overdue').length || 0} contas</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-900 font-medium">Total Pendente:</span>
                                <span className="font-bold text-red-600">{formatCurrency(data?.summary.totalBillsPending || 0)}</span>
                            </div>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => generatePDF('bills')}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Exportar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Collaborators Report */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Colaboradores</CardTitle>
                                <CardDescription>Lista de colaboradores ativos</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ativos:</span>
                                <span className="font-medium">{data?.summary.totalCollaborators} colaboradores</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">CLT + PJ:</span>
                                <span className="font-medium">{(data?.summary.totalCLT || 0) + (data?.summary.totalPJ || 0)} contratos</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-900 font-medium">Departamentos:</span>
                                <span className="font-bold">{new Set(data?.collaborators.map((c: any) => c.department)).size}</span>
                            </div>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => generatePDF('collaborators')}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Exportar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
