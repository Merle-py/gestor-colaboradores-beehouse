'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    FileText,
    Check,
    Clock,
    AlertCircle,
    Loader2,
    Calendar,
    DollarSign,
    Upload,
    Eye,
    Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface NotaFiscal {
    id: string
    collaborator_id: string
    collaborator_name: string
    nf_number: string
    nf_date: string
    nf_value: number
    competence_month: string
    status: 'pending' | 'received' | 'approved' | 'paid'
    file_url: string | null
    created_at: string
}

interface Collaborator {
    id: string
    full_name: string
    contract_type: string
}

export default function NotasFiscaisPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [notas, setNotas] = useState<NotaFiscal[]>([])
    const [pjCollaborators, setPjCollaborators] = useState<Collaborator[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Todos')
    const [monthFilter, setMonthFilter] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // New NF form
    const [newNF, setNewNF] = useState({
        collaborator_id: '',
        nf_number: '',
        nf_date: new Date().toISOString().split('T')[0],
        nf_value: '',
        competence_month: new Date().toISOString().slice(0, 7), // YYYY-MM
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch PJ collaborators
        const { data: collabs } = await supabase
            .from('collaborators')
            .select('id, full_name, contract_type')
            .eq('contract_type', 'PJ')
            .eq('status', 'ativo')
            .order('full_name')

        if (collabs) setPjCollaborators(collabs)

        // Fetch notas fiscais
        const { data: nfs } = await supabase
            .from('notas_fiscais')
            .select('*, collaborator:collaborators(full_name)')
            .order('nf_date', { ascending: false })

        if (nfs) {
            setNotas(nfs.map((nf: any) => ({
                ...nf,
                collaborator_name: nf.collaborator?.full_name || 'N/A',
            })))
        }

        setLoading(false)
    }

    const handleAddNF = async () => {
        if (!newNF.collaborator_id || !newNF.nf_number || !newNF.nf_value) {
            setFeedback({ message: 'Preencha todos os campos obrigatórios', type: 'error' })
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase.from('notas_fiscais').insert({
                collaborator_id: newNF.collaborator_id,
                nf_number: newNF.nf_number,
                nf_date: newNF.nf_date,
                nf_value: parseFloat(newNF.nf_value),
                competence_month: newNF.competence_month,
                status: 'received',
            })

            if (error) throw error

            setFeedback({ message: 'Nota fiscal registrada com sucesso!', type: 'success' })
            setDialogOpen(false)
            setNewNF({
                collaborator_id: '',
                nf_number: '',
                nf_date: new Date().toISOString().split('T')[0],
                nf_value: '',
                competence_month: new Date().toISOString().slice(0, 7),
            })
            fetchData()
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        await supabase.from('notas_fiscais').update({ status }).eq('id', id)
        fetchData()
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
            pending: { label: 'Pendente', variant: 'warning' },
            received: { label: 'Recebida', variant: 'neutral' },
            approved: { label: 'Aprovada', variant: 'success' },
            paid: { label: 'Paga', variant: 'success' },
        }
        const c = config[status] || { label: status, variant: 'neutral' }
        return <Badge variant={c.variant}>{c.label}</Badge>
    }

    const filteredNotas = notas.filter((nf) => {
        const matchesSearch = nf.collaborator_name.toLowerCase().includes(search.toLowerCase()) ||
            nf.nf_number.includes(search)
        const matchesStatus = statusFilter === 'Todos' || nf.status === statusFilter.toLowerCase()
        const matchesMonth = !monthFilter || nf.competence_month === monthFilter
        return matchesSearch && matchesStatus && matchesMonth
    })

    // Stats
    const totalValue = filteredNotas.reduce((acc, nf) => acc + nf.nf_value, 0)
    const pendingCount = notas.filter((nf) => nf.status === 'pending' || nf.status === 'received').length

    // Generate month options
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        return date.toISOString().slice(0, 7)
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/contratos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais PJ</h1>
                        <p className="text-gray-500">Controle de notas fiscais de prestadores</p>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Registrar NF
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Nota Fiscal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prestador PJ *</label>
                                <Select value={newNF.collaborator_id} onValueChange={(v) => setNewNF({ ...newNF, collaborator_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pjCollaborators.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Número da NF *</label>
                                    <Input
                                        value={newNF.nf_number}
                                        onChange={(e) => setNewNF({ ...newNF, nf_number: e.target.value })}
                                        placeholder="Ex: 001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data de Emissão</label>
                                    <Input
                                        type="date"
                                        value={newNF.nf_date}
                                        onChange={(e) => setNewNF({ ...newNF, nf_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor (R$) *</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newNF.nf_value}
                                        onChange={(e) => setNewNF({ ...newNF, nf_value: e.target.value })}
                                        placeholder="0,00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Competência</label>
                                    <Input
                                        type="month"
                                        value={newNF.competence_month}
                                        onChange={(e) => setNewNF({ ...newNF, competence_month: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleAddNF} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{notas.length}</p>
                            <p className="text-xs text-gray-500">Total NFs</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                            <p className="text-xs text-gray-500">Pendentes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">Valor Total Filtrado</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                icon={Search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por prestador ou nº NF..."
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="received">Recebida</SelectItem>
                                <SelectItem value="approved">Aprovada</SelectItem>
                                <SelectItem value="paid">Paga</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={monthFilter || 'all'} onValueChange={(v) => setMonthFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Competência" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {monthOptions.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : filteredNotas.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>Nenhuma nota fiscal encontrada</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Prestador</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Nº NF</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Competência</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Valor</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredNotas.map((nf) => (
                                        <tr key={nf.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">{nf.collaborator_name}</td>
                                            <td className="p-4 text-gray-600">{nf.nf_number}</td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(nf.competence_month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 font-medium text-green-600">
                                                R$ {nf.nf_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">{getStatusBadge(nf.status)}</td>
                                            <td className="p-4">
                                                <div className="flex gap-1">
                                                    {nf.status === 'received' && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(nf.id, 'approved')}>
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    {nf.status === 'approved' && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(nf.id, 'paid')}>
                                                            <DollarSign className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
