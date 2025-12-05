'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Loader2,
    Calendar,
    Download,
    MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface Payment {
    id: string
    collaborator_id: string
    collaborator_name: string
    contract_type: string
    payment_type: 'invoice' | 'salary' | 'bonus' | 'other'
    reference_month: string
    gross_value: number
    deductions: number
    net_value: number
    due_date: string
    paid_date: string | null
    status: 'pending' | 'paid' | 'overdue' | 'scheduled'
    invoice_number: string | null
}

export default function PagamentosPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<Payment[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [collaborators, setCollaborators] = useState<{ id: string; full_name: string; contract_type: string }[]>([])

    // New payment form
    const [newPayment, setNewPayment] = useState({
        collaborator_id: '',
        payment_type: 'invoice' as const,
        reference_month: new Date().toISOString().slice(0, 7),
        gross_value: '',
        deductions: '0',
        due_date: '',
        invoice_number: '',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch collaborators with contracts
        const { data: contracts } = await (supabase.from('contracts') as any)
            .select('collaborator_id, contract_type, monthly_value, collaborator:collaborators(id, full_name)')
            .eq('status', 'active')

        if (contracts) {
            // Create mock payments from PJ contracts
            const mockPayments: Payment[] = contracts
                .filter((c: any) => c.contract_type === 'PJ')
                .map((c: any, index: number) => {
                    const today = new Date()
                    const dueDate = new Date(today.getFullYear(), today.getMonth(), 15)
                    const isPast = dueDate < today

                    return {
                        id: `payment-${index}`,
                        collaborator_id: c.collaborator_id,
                        collaborator_name: c.collaborator?.full_name || 'N/A',
                        contract_type: c.contract_type,
                        payment_type: 'invoice' as const,
                        reference_month: today.toISOString().slice(0, 7),
                        gross_value: c.monthly_value || 0,
                        deductions: 0,
                        net_value: c.monthly_value || 0,
                        due_date: dueDate.toISOString().split('T')[0],
                        paid_date: null,
                        status: isPast ? 'overdue' : 'pending' as const,
                        invoice_number: null,
                    }
                })

            setPayments(mockPayments)

            // Set collaborators for dropdown
            const collabList = contracts.map((c: any) => ({
                id: c.collaborator_id,
                full_name: c.collaborator?.full_name || 'N/A',
                contract_type: c.contract_type,
            }))
            setCollaborators(collabList)
        }

        setLoading(false)
    }

    const handleMarkAsPaid = (id: string) => {
        setPayments(payments.map(p =>
            p.id === id ? { ...p, status: 'paid' as const, paid_date: new Date().toISOString().split('T')[0] } : p
        ))
    }

    const handleAddPayment = async () => {
        if (!newPayment.collaborator_id || !newPayment.gross_value || !newPayment.due_date) return

        setSaving(true)

        const collab = collaborators.find(c => c.id === newPayment.collaborator_id)
        const grossValue = parseFloat(newPayment.gross_value)
        const deductions = parseFloat(newPayment.deductions || '0')

        const payment: Payment = {
            id: `payment-${Date.now()}`,
            collaborator_id: newPayment.collaborator_id,
            collaborator_name: collab?.full_name || 'N/A',
            contract_type: collab?.contract_type || 'PJ',
            payment_type: newPayment.payment_type,
            reference_month: newPayment.reference_month,
            gross_value: grossValue,
            deductions: deductions,
            net_value: grossValue - deductions,
            due_date: newPayment.due_date,
            paid_date: null,
            status: 'pending',
            invoice_number: newPayment.invoice_number || null,
        }

        setPayments([payment, ...payments])
        setShowAddDialog(false)
        setNewPayment({
            collaborator_id: '',
            payment_type: 'invoice',
            reference_month: new Date().toISOString().slice(0, 7),
            gross_value: '',
            deductions: '0',
            due_date: '',
            invoice_number: '',
        })
        setSaving(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const getStatusConfig = (status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral'; icon: any }> = {
            paid: { label: 'Pago', variant: 'success', icon: CheckCircle },
            pending: { label: 'Pendente', variant: 'warning', icon: Clock },
            overdue: { label: 'Atrasado', variant: 'error', icon: AlertCircle },
            scheduled: { label: 'Agendado', variant: 'neutral', icon: Calendar },
        }
        return config[status] || { label: status, variant: 'neutral', icon: Clock }
    }

    const getPaymentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            invoice: 'Nota Fiscal',
            salary: 'Salário',
            bonus: 'Bônus',
            other: 'Outro',
        }
        return labels[type] || type
    }

    const filteredPayments = payments.filter(p => {
        const matchSearch = p.collaborator_name.toLowerCase().includes(search.toLowerCase()) ||
            p.invoice_number?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || p.status === statusFilter
        const matchType = typeFilter === 'all' || p.payment_type === typeFilter
        return matchSearch && matchStatus && matchType
    })

    const stats = {
        total: filteredPayments.reduce((sum, p) => sum + p.net_value, 0),
        pending: filteredPayments.filter(p => p.status === 'pending').length,
        overdue: filteredPayments.filter(p => p.status === 'overdue').length,
        paid: filteredPayments.filter(p => p.status === 'paid').length,
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
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Pagamentos</h1>
                    <p className="text-gray-500 text-sm">Controle de notas fiscais e pagamentos</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pagamento
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
                        <p className="text-xs text-gray-500">Total do Período</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                        <p className="text-xs text-amber-600">Pendentes</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
                        <p className="text-xs text-red-600">Atrasados</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
                        <p className="text-xs text-green-600">Pagos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome ou NF..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Status</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Atrasado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Tipos</SelectItem>
                                <SelectItem value="invoice">Nota Fiscal</SelectItem>
                                <SelectItem value="salary">Salário</SelectItem>
                                <SelectItem value="bonus">Bônus</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Add Payment Dialog */}
            {showAddDialog && (
                <Card className="border-2 border-primary-200 bg-primary-50/30">
                    <CardHeader>
                        <CardTitle>Novo Pagamento</CardTitle>
                        <CardDescription>Registre um novo pagamento ou nota fiscal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Colaborador *</label>
                                <Select
                                    value={newPayment.collaborator_id}
                                    onValueChange={(v) => setNewPayment({ ...newPayment, collaborator_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collaborators.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.full_name} ({c.contract_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo *</label>
                                <Select
                                    value={newPayment.payment_type}
                                    onValueChange={(v: any) => setNewPayment({ ...newPayment, payment_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="invoice">Nota Fiscal</SelectItem>
                                        <SelectItem value="salary">Salário</SelectItem>
                                        <SelectItem value="bonus">Bônus</SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mês Referência</label>
                                <Input
                                    type="month"
                                    value={newPayment.reference_month}
                                    onChange={(e) => setNewPayment({ ...newPayment, reference_month: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nº Nota Fiscal</label>
                                <Input
                                    value={newPayment.invoice_number}
                                    onChange={(e) => setNewPayment({ ...newPayment, invoice_number: e.target.value })}
                                    placeholder="Ex: NF-00123"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Valor Bruto *</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newPayment.gross_value}
                                    onChange={(e) => setNewPayment({ ...newPayment, gross_value: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deduções</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newPayment.deductions}
                                    onChange={(e) => setNewPayment({ ...newPayment, deductions: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Vencimento *</label>
                                <Input
                                    type="date"
                                    value={newPayment.due_date}
                                    onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddPayment} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payments List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Lista de Pagamentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum pagamento encontrado</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPayments.map((payment) => {
                                const statusConfig = getStatusConfig(payment.status)
                                const StatusIcon = statusConfig.icon
                                return (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100' :
                                                payment.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'
                                                }`}>
                                                <StatusIcon className={`w-5 h-5 ${payment.status === 'paid' ? 'text-green-600' :
                                                    payment.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{payment.collaborator_name}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{getPaymentTypeLabel(payment.payment_type)}</span>
                                                    {payment.invoice_number && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{payment.invoice_number}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatCurrency(payment.net_value)}</p>
                                                <p className="text-xs text-gray-500">
                                                    Venc: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {payment.status !== 'paid' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleMarkAsPaid(payment.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                            Marcar como Pago
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            alert(`Comprovante de ${payment.collaborator_name} - ${formatCurrency(payment.net_value)} - Ref: ${payment.reference_month}`)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Baixar Comprovante
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
