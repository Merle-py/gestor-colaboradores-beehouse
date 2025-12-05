'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, RefreshCw, Search, MoreHorizontal, Calendar, Clock, Users, CheckCircle, XCircle, Eye } from 'lucide-react'
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
import type { RecessRequest, RecessStatus } from '@/types/database.types'

export default function RecessosPage() {
    const supabase = createClient()
    const [recesses, setRecesses] = useState<(RecessRequest & { collaborator?: { full_name: string } })[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('Todos')

    const fetchRecesses = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('recess_requests')
            .select('*, collaborator:collaborators(full_name)')
            .order('start_date', { ascending: false })

        if (error) {
            console.error(error)
            setRecesses([])
        } else {
            setRecesses(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRecesses()
    }, [])

    const filteredRecesses = recesses.filter((r) => {
        const matchesSearch = r.collaborator?.full_name?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'Todos' || r.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: RecessStatus) => {
        const config: Record<RecessStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
            requested: { label: 'Solicitado', variant: 'warning' },
            approved: { label: 'Aprovado', variant: 'success' },
            in_progress: { label: 'Em Andamento', variant: 'success' },
            completed: { label: 'Concluído', variant: 'neutral' },
            rejected: { label: 'Rejeitado', variant: 'error' },
            cancelled: { label: 'Cancelado', variant: 'neutral' },
        }
        const c = config[status]
        return <Badge variant={c.variant} className="rounded-full font-bold">{c.label}</Badge>
    }

    const pendingCount = recesses.filter(r => r.status === 'requested').length
    const inProgressCount = recesses.filter(r => r.status === 'in_progress').length

    const handleApprove = async (id: string) => {
        if (!confirm('Aprovar esta solicitação de recesso?')) return

        await (supabase.from('recess_requests') as any)
            .update({ status: 'approved' })
            .eq('id', id)

        fetchRecesses()
    }

    const handleReject = async (id: string) => {
        if (!confirm('Rejeitar esta solicitação de recesso?')) return

        await (supabase.from('recess_requests') as any)
            .update({ status: 'rejected' })
            .eq('id', id)

        fetchRecesses()
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recessos & Ausências</h1>
                    <p className="text-gray-500 mt-2">Gerencie férias, licenças e períodos de recesso.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchRecesses} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/recessos/novo">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Solicitação
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                        <p className="text-xs text-gray-500">Aguardando Aprovação</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                        <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
                        <p className="text-xs text-gray-500">Em Recesso Agora</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Input
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por colaborador..."
                            className="shadow-sm bg-white"
                        />
                    </div>
                    <div className="w-40">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos</SelectItem>
                                <SelectItem value="requested">Solicitado</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!loading && filteredRecesses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">Nenhuma solicitação encontrada.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead>Dias</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecesses.map((recess) => (
                                    <TableRow key={recess.id}>
                                        <TableCell>
                                            <p className="font-bold text-gray-900">{recess.collaborator?.full_name || 'N/A'}</p>
                                            <p className="text-xs text-gray-400 capitalize">{recess.category || recess.request_type}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {recess.request_type === 'collective' ? 'Coletivo' : 'Individual'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {new Date(recess.start_date).toLocaleDateString('pt-BR')} - {new Date(recess.end_date).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-gray-900">{recess.total_days}</span>
                                            <span className="text-gray-400 text-xs ml-1">dias</span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(recess.status)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <Link href={`/colaboradores/${recess.collaborator_id}`}>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver colaborador
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    {recess.status === 'requested' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleApprove(recess.id)} className="text-green-600 cursor-pointer">
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Aprovar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleReject(recess.id)} className="text-red-600 cursor-pointer">
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Rejeitar
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <span className="text-sm text-gray-500">Total: {filteredRecesses.length} solicitações</span>
                </div>
            </div>
        </div>
    )
}
