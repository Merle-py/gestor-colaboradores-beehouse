'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
    Calendar,
    Plus,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    User,
    CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { createClient } from '@/lib/supabase/client'

interface Absence {
    id: string
    collaborator_id: string
    collaborator_name: string
    type: 'ferias' | 'licenca_medica' | 'licenca_maternidade' | 'outro'
    start_date: string
    end_date: string
    status: 'pending' | 'approved' | 'rejected'
    reason: string | null
    created_at: string
}

export default function AusenciasPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [absences, setAbsences] = useState<Absence[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')

    const fetchAbsences = useCallback(async () => {
        setLoading(true)

        // Try to get from recess_requests first, otherwise use mock data
        const { data: recessData } = await supabase
            .from('recess_requests')
            .select('*, collaborator:collaborators(full_name)')
            .order('start_date', { ascending: false })

        if (recessData && recessData.length > 0) {
            setAbsences(recessData.map((r: any) => ({
                id: r.id,
                collaborator_id: r.collaborator_id,
                collaborator_name: r.collaborator?.full_name || 'N/A',
                type: r.recess_type === 'férias' ? 'ferias' : 'outro',
                start_date: r.start_date,
                end_date: r.end_date,
                status: r.status,
                reason: r.reason,
                created_at: r.created_at,
            })))
        } else {
            // Mock data for demonstration
            setAbsences([
                {
                    id: '1',
                    collaborator_id: 'c1',
                    collaborator_name: 'Maria Silva',
                    type: 'ferias',
                    start_date: '2024-01-15',
                    end_date: '2024-01-30',
                    status: 'approved',
                    reason: 'Férias anuais',
                    created_at: '2024-01-01',
                },
                {
                    id: '2',
                    collaborator_id: 'c2',
                    collaborator_name: 'João Santos',
                    type: 'licenca_medica',
                    start_date: '2024-02-01',
                    end_date: '2024-02-05',
                    status: 'pending',
                    reason: 'Consulta médica',
                    created_at: '2024-01-28',
                },
            ])
        }

        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchAbsences()
    }, [fetchAbsences])

    const filteredAbsences = useMemo(() => {
        return absences.filter(a => {
            const matchSearch = a.collaborator_name.toLowerCase().includes(search.toLowerCase())
            const matchStatus = statusFilter === 'all' || a.status === statusFilter
            const matchType = typeFilter === 'all' || a.type === typeFilter
            return matchSearch && matchStatus && matchType
        })
    }, [absences, search, statusFilter, typeFilter])

    const getStatusBadge = useCallback((status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral'; icon: React.ReactNode }> = {
            approved: { label: 'Aprovado', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
            pending: { label: 'Pendente', variant: 'warning', icon: <Clock className="w-3 h-3" /> },
            rejected: { label: 'Rejeitado', variant: 'error', icon: <XCircle className="w-3 h-3" /> },
        }
        const c = config[status] || config.pending
        return (
            <Badge variant={c.variant} className="rounded-full font-bold flex items-center gap-1 w-fit">
                {c.icon}
                {c.label}
            </Badge>
        )
    }, [])

    const getTypeLabel = useCallback((type: string) => {
        const labels: Record<string, string> = {
            ferias: 'Férias',
            licenca_medica: 'Licença Médica',
            licenca_maternidade: 'Licença Maternidade',
            outro: 'Outro',
        }
        return labels[type] || type
    }, [])

    const getDaysCount = useCallback((start: string, end: string) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return diff
    }, [])

    const stats = useMemo(() => ({
        total: absences.length,
        pending: absences.filter(a => a.status === 'pending').length,
        approved: absences.filter(a => a.status === 'approved').length,
        ferias: absences.filter(a => a.type === 'ferias').length,
    }), [absences])

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ausências</h1>
                    <p className="text-gray-500 mt-2">Gerencie férias, licenças e afastamentos.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchAbsences} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/recessos/novo">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Ausência
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total de Ausências</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                            <p className="text-xs text-gray-500">Pendentes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            <p className="text-xs text-gray-500">Aprovadas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <CalendarDays className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">{stats.ferias}</p>
                            <p className="text-xs text-gray-500">Férias</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Input
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar colaborador..."
                            className="shadow-sm bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="ferias">Férias</SelectItem>
                                <SelectItem value="licenca_medica">Licença Médica</SelectItem>
                                <SelectItem value="licenca_maternidade">Licença Maternidade</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </div>
                ) : filteredAbsences.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">Nenhuma ausência encontrada.</p>
                        <p className="text-xs mt-1">Registre férias e licenças dos colaboradores.</p>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAbsences.map((absence) => (
                                <TableRow key={absence.id} className="hover:bg-gray-50 cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                                                {absence.collaborator_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{absence.collaborator_name}</p>
                                                {absence.reason && (
                                                    <p className="text-xs text-gray-500">{absence.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="neutral">{getTypeLabel(absence.type)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {new Date(absence.start_date).toLocaleDateString('pt-BR')} - {new Date(absence.end_date).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold text-gray-900">{getDaysCount(absence.start_date, absence.end_date)}</span>
                                        <span className="text-gray-500 text-xs ml-1">dias</span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(absence.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <span className="text-sm text-gray-500">Total: {filteredAbsences.length} ausências</span>
                </div>
            </div>
        </div>
    )
}
