'use client'

import { useState, useEffect } from 'react'
import {
    DollarSign,
    Calendar,
    AlertTriangle,
    Check,
    Clock,
    Plus,
    Filter,
    Search,
    ChevronDown,
    MoreVertical,
    Edit2,
    Trash2,
    Loader2,
    Receipt,
    Zap,
    Droplets,
    Wifi,
    Home,
    Building2,
    Users,
    Megaphone,
    Wrench,
    Monitor,
    HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'

interface Bill {
    id: string
    description: string
    category: string
    type: 'pagar' | 'receber'
    amount: number
    due_date: string
    payment_date: string | null
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    supplier_name: string | null
    is_recurring: boolean
    notes: string | null
}

const CATEGORIES = [
    { value: 'energia', label: 'Energia', icon: Zap, color: 'text-yellow-500' },
    { value: 'agua', label: 'Água', icon: Droplets, color: 'text-blue-500' },
    { value: 'internet', label: 'Internet', icon: Wifi, color: 'text-purple-500' },
    { value: 'telefone', label: 'Telefone', icon: Monitor, color: 'text-green-500' },
    { value: 'aluguel', label: 'Aluguel', icon: Home, color: 'text-orange-500' },
    { value: 'condominio', label: 'Condomínio', icon: Building2, color: 'text-gray-500' },
    { value: 'fornecedor', label: 'Fornecedor', icon: Receipt, color: 'text-indigo-500' },
    { value: 'colaborador', label: 'Colaborador', icon: Users, color: 'text-pink-500' },
    { value: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-red-500' },
    { value: 'manutencao', label: 'Manutenção', icon: Wrench, color: 'text-amber-600' },
    { value: 'outros', label: 'Outros', icon: HelpCircle, color: 'text-gray-400' },
]

const COLUMNS = [
    {
        id: 'upcoming', title: 'A Vencer', status: ['pending'], filter: (b: Bill) => {
            const due = new Date(b.due_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return b.status === 'pending' && due > today
        }, color: 'border-blue-500', bgColor: 'bg-blue-50'
    },
    {
        id: 'today', title: 'Vence Hoje', status: ['pending'], filter: (b: Bill) => {
            const due = new Date(b.due_date).toISOString().split('T')[0]
            const today = new Date().toISOString().split('T')[0]
            return b.status === 'pending' && due === today
        }, color: 'border-yellow-500', bgColor: 'bg-yellow-50'
    },
    {
        id: 'overdue', title: 'Vencidas', status: ['overdue', 'pending'], filter: (b: Bill) => {
            const due = new Date(b.due_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return b.status === 'overdue' || (b.status === 'pending' && due < today)
        }, color: 'border-red-500', bgColor: 'bg-red-50'
    },
    {
        id: 'paid', title: 'Pagas', status: ['paid'], filter: (b: Bill) => b.status === 'paid',
        color: 'border-green-500', bgColor: 'bg-green-50'
    },
]

export default function KanbanFinanceiroPage() {
    const [bills, setBills] = useState<Bill[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editBill, setEditBill] = useState<Bill | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [filterCategory, setFilterCategory] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        description: '',
        category: 'outros',
        type: 'pagar' as 'pagar' | 'receber',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        is_recurring: false,
        recurrence_type: 'monthly',
        notes: '',
    })

    useEffect(() => {
        fetchBills()
    }, [])

    const fetchBills = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            const res = await fetch('/api/bills', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setBills(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching bills:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFeedback(null)

        try {
            const token = localStorage.getItem('auth_token')
            const url = editBill ? '/api/bills' : '/api/bills'
            const method = editBill ? 'PUT' : 'POST'

            const body = editBill
                ? { id: editBill.id, ...formData }
                : formData

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            })

            const data = await res.json()
            if (data.success) {
                setFeedback({ message: editBill ? 'Conta atualizada!' : 'Conta criada!', type: 'success' })
                fetchBills()
                setShowAddModal(false)
                setEditBill(null)
                resetForm()
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        }
    }

    const handleMarkAsPaid = async (bill: Bill) => {
        try {
            const token = localStorage.getItem('auth_token')
            const res = await fetch('/api/bills', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: bill.id,
                    status: 'paid',
                    paid_amount: bill.amount
                }),
            })

            const data = await res.json()
            if (data.success) {
                fetchBills()
            }
        } catch (error) {
            console.error('Error marking as paid:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return

        try {
            const token = localStorage.getItem('auth_token')
            const res = await fetch(`/api/bills?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()
            if (data.success) {
                fetchBills()
            }
        } catch (error) {
            console.error('Error deleting bill:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            description: '',
            category: 'outros',
            type: 'pagar',
            amount: '',
            due_date: new Date().toISOString().split('T')[0],
            supplier_name: '',
            is_recurring: false,
            recurrence_type: 'monthly',
            notes: '',
        })
    }

    const openEditModal = (bill: Bill) => {
        setEditBill(bill)
        setFormData({
            description: bill.description,
            category: bill.category,
            type: bill.type,
            amount: bill.amount.toString(),
            due_date: bill.due_date,
            supplier_name: bill.supplier_name || '',
            is_recurring: bill.is_recurring,
            recurrence_type: 'monthly',
            notes: bill.notes || '',
        })
        setShowAddModal(true)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const getCategoryInfo = (category: string) => {
        return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1]
    }

    const filteredBills = bills.filter(bill => {
        const matchesCategory = !filterCategory || bill.category === filterCategory
        const matchesSearch = !searchTerm ||
            bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const getColumnBills = (column: typeof COLUMNS[0]) => {
        return filteredBills.filter(column.filter)
    }

    const getColumnTotal = (column: typeof COLUMNS[0]) => {
        return getColumnBills(column).reduce((sum, bill) => sum + bill.amount, 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#f9b410]" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kanban Financeiro</h1>
                    <p className="text-gray-500">Gerencie suas contas de forma visual</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-48"
                        />
                    </div>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-40">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todas</SelectItem>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={() => { resetForm(); setEditBill(null); setShowAddModal(true) }}
                        className="bg-[#f9b410] text-black hover:bg-[#e0a20e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Conta
                    </Button>
                </div>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                    {feedback.message}
                </Alert>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {COLUMNS.map(column => {
                    const columnBills = getColumnBills(column)
                    const total = getColumnTotal(column)

                    return (
                        <div key={column.id} className={`rounded-xl border-t-4 ${column.color} bg-white shadow-sm`}>
                            <div className={`p-4 ${column.bgColor} rounded-t-lg border-b`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">{column.title}</h3>
                                    <Badge variant="outline" className="font-mono">
                                        {columnBills.length}
                                    </Badge>
                                </div>
                                <p className="text-sm font-semibold text-gray-600 mt-1">
                                    {formatCurrency(total)}
                                </p>
                            </div>

                            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                                {columnBills.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-8">
                                        Nenhuma conta
                                    </p>
                                ) : (
                                    columnBills.map(bill => {
                                        const catInfo = getCategoryInfo(bill.category)
                                        const CatIcon = catInfo.icon

                                        return (
                                            <Card key={bill.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg bg-gray-100 ${catInfo.color}`}>
                                                                <CatIcon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                                                    {bill.description}
                                                                </p>
                                                                {bill.supplier_name && (
                                                                    <p className="text-xs text-gray-500">{bill.supplier_name}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {bill.status !== 'paid' && (
                                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(bill)}>
                                                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                                                        Marcar como Paga
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => openEditModal(bill)}>
                                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(bill.id)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(bill.amount)}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>

                                                    {bill.is_recurring && (
                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                            🔄 Recorrente
                                                        </Badge>
                                                    )}

                                                    {bill.status !== 'paid' && column.id !== 'paid' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full mt-3 text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleMarkAsPaid(bill)}
                                                        >
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editBill ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição *
                            </label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Conta de luz - Dezembro"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoria *
                                </label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo *
                                </label>
                                <Select value={formData.type} onValueChange={(v: 'pagar' | 'receber') => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pagar">A Pagar</SelectItem>
                                        <SelectItem value="receber">A Receber</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0,00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vencimento *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fornecedor/Beneficiário
                            </label>
                            <Input
                                value={formData.supplier_name}
                                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                placeholder="Nome do fornecedor"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={formData.is_recurring}
                                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="recurring" className="text-sm text-gray-700">
                                Conta recorrente (repete todo mês)
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                rows={2}
                                placeholder="Informações adicionais..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#f9b410] text-black hover:bg-[#e0a20e]">
                                {editBill ? 'Salvar' : 'Criar Conta'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
