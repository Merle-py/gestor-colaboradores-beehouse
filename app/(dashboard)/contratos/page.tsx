'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Search, MoreHorizontal, AlertTriangle, FileText, Eye, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import type { Contract, ContractStatus, ContractType } from '@/types/database.types'

export default function ContratosPage() {
    const router = useRouter()
    const supabase = createClient()
    const [contracts, setContracts] = useState<(Contract & { collaborator?: { full_name: string } })[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('Todos')
    const [typeFilter, setTypeFilter] = useState<string>('Todos')

    const fetchContracts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('contracts')
            .select('*, collaborator:collaborators(full_name)')
            .order('end_date', { ascending: true })

        if (error) {
            console.error(error)
            setContracts([])
        } else {
            setContracts(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchContracts()
    }, [])

    const filteredContracts = contracts.filter((c) => {
        const matchesSearch = c.collaborator?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.contract_number?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter
        const matchesType = typeFilter === 'Todos' || c.contract_type === typeFilter
        return matchesSearch && matchesStatus && matchesType
    })

    const getStatusBadge = (status: ContractStatus) => {
        const config: Record<ContractStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
            active: { label: 'Ativo', variant: 'success' },
            expired: { label: 'Expirado', variant: 'error' },
            renewed: { label: 'Renovado', variant: 'success' },
            cancelled: { label: 'Cancelado', variant: 'neutral' },
            pending: { label: 'Pendente', variant: 'warning' },
        }
        const c = config[status]
        return <Badge variant={c.variant} className="rounded-full font-bold">{c.label}</Badge>
    }

    const getDaysUntilExpiration = (endDate: string | null) => {
        if (!endDate) return null
        const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days
    }

    const handleRenewContract = async (contractId: string) => {
        if (!confirm('Deseja renovar este contrato por mais 12 meses?')) return

        const contract = contracts.find(c => c.id === contractId)
        if (!contract) return

        const currentEnd = contract.end_date ? new Date(contract.end_date) : new Date()
        const newEnd = new Date(currentEnd)
        newEnd.setFullYear(newEnd.getFullYear() + 1)

        await (supabase.from('contracts') as any)
            .update({
                end_date: newEnd.toISOString().split('T')[0],
                renewal_date: new Date().toISOString().split('T')[0],
                status: 'active'
            })
            .eq('id', contractId)

        fetchContracts()
    }

    const handleCancelContract = async (contractId: string) => {
        if (!confirm('Tem certeza que deseja encerrar este contrato?')) return

        await (supabase.from('contracts') as any)
            .update({ status: 'cancelled' })
            .eq('id', contractId)

        fetchContracts()
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contratos</h1>
                    <p className="text-gray-500 mt-2">Gerencie contratos de trabalho e prestação de serviços.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchContracts} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/contratos/novo">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Contrato
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alerts Section */}
            {contracts.some(c => c.status === 'active' && getDaysUntilExpiration(c.end_date) !== null && getDaysUntilExpiration(c.end_date)! <= 30) && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                        <p className="font-bold text-amber-800">Atenção: Contratos próximos do vencimento</p>
                        <p className="text-sm text-amber-700">
                            {contracts.filter(c => c.status === 'active' && getDaysUntilExpiration(c.end_date) !== null && getDaysUntilExpiration(c.end_date)! <= 30).length} contratos vencem nos próximos 30 dias.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Input
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por colaborador ou nº contrato..."
                            className="shadow-sm bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos</SelectItem>
                                <SelectItem value="CLT">CLT</SelectItem>
                                <SelectItem value="PJ">PJ</SelectItem>
                                <SelectItem value="Estagiário">Estagiário</SelectItem>
                                <SelectItem value="Temporário">Temporário</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="expired">Expirado</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!loading && filteredContracts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">Nenhum contrato encontrado.</p>
                        <p className="text-xs mt-1">Cadastre um novo contrato para começar.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Início</TableHead>
                                <TableHead>Término</TableHead>
                                <TableHead>Valor Mensal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContracts.map((contract) => {
                                    const daysLeft = getDaysUntilExpiration(contract.end_date)
                                    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0
                                    const isExpired = daysLeft !== null && daysLeft <= 0

                                    return (
                                        <TableRow key={contract.id} className={isExpiringSoon ? 'bg-amber-50/50' : isExpired ? 'bg-red-50/50' : ''}>
                                            <TableCell>
                                                <p className="font-bold text-gray-900">{contract.collaborator?.full_name || 'N/A'}</p>
                                                {contract.contract_number && (
                                                    <p className="text-xs text-gray-400">Nº {contract.contract_number}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium">{contract.contract_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">
                                                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-BR') : 'Indeterminado'}
                                                    </span>
                                                    {daysLeft !== null && daysLeft <= 30 && (
                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${daysLeft <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {daysLeft <= 0 ? 'Vencido' : `${daysLeft}d`}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900">
                                                {contract.monthly_value
                                                    ? `R$ ${contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell>{getStatusBadge(contract.status)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <Link href={`/colaboradores/${contract.collaborator_id}`}>
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Ver colaborador
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuItem onClick={() => handleRenewContract(contract.id)} className="cursor-pointer">
                                                            <RotateCcw className="w-4 h-4 mr-2" />
                                                            Renovar contrato
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCancelContract(contract.id)} className="text-red-600 cursor-pointer">
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Encerrar contrato
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                )}

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <span className="text-sm text-gray-500">Total: {filteredContracts.length} contratos</span>
                </div>
            </div>
        </div>
    )
}
