'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    RefreshCw,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Users,
    Building2,
    Briefcase,
    Eye,
    FileText,
    Calendar,
    Filter,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface Collaborator {
    id: string
    full_name: string
    email: string
    department: string
    position: string | null
    contract_type: string | null
    hire_date: string | null
    status: string
}

const departmentsList = [
    'Administrativo', 'Comercial', 'Financeiro', 'Marketing',
    'Operacional', 'RH', 'TI', 'Jurídico', 'Engenharia',
]

const contractTypes = ['CLT', 'PJ', 'Estagiário', 'Temporário']

export default function ColaboradoresPage() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Todos')
    const [departmentFilter, setDepartmentFilter] = useState('Todos')
    const [contractFilter, setContractFilter] = useState('Todos')
    const [showFilters, setShowFilters] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const fetchCollaborators = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            setCollaborators([])
        } else {
            setCollaborators(
                (data as any[]).map((c) => ({
                    id: c.id,
                    full_name: c.full_name || 'Sem Nome',
                    email: c.email || '-',
                    department: c.department || 'Geral',
                    position: c.position,
                    contract_type: c.contract_type,
                    hire_date: c.hire_date,
                    status: c.status || 'ativo',
                }))
            )
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCollaborators()
    }, [])

    const clearFilters = () => {
        setStatusFilter('Todos')
        setDepartmentFilter('Todos')
        setContractFilter('Todos')
        setSearch('')
    }

    const hasActiveFilters = statusFilter !== 'Todos' || departmentFilter !== 'Todos' || contractFilter !== 'Todos' || search

    const filteredRows = collaborators.filter((p) => {
        const s = search.toLowerCase()
        const matchesSearch =
            p.full_name.toLowerCase().includes(s) ||
            p.email.toLowerCase().includes(s) ||
            (p.position?.toLowerCase().includes(s) ?? false)
        const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter.toLowerCase()
        const matchesDepartment = departmentFilter === 'Todos' || p.department === departmentFilter
        const matchesContract = contractFilter === 'Todos' || p.contract_type === contractFilter
        return matchesSearch && matchesStatus && matchesDepartment && matchesContract
    })

    // Stats
    const activeCount = collaborators.filter(c => c.status === 'ativo').length
    const cltCount = collaborators.filter(c => c.contract_type === 'CLT').length
    const pjCount = collaborators.filter(c => c.contract_type === 'PJ').length

    const getStatusVariant = (status: string) => {
        if (status === 'ativo') return 'success'
        if (status === 'ferias') return 'warning'
        if (status === 'afastado') return 'warning'
        if (status === 'desligado') return 'error'
        return 'neutral'
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
    }

    const handleRowClick = (id: string) => {
        router.push(`/colaboradores/${id}`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Colaboradores</h1>
                    <p className="text-gray-500 mt-1">Gerencie o quadro de funcionários, contratos e status.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchCollaborators} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/colaboradores/novo">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Admissão
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{collaborators.length}</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                        <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                        <p className="text-xs text-gray-500">Ativos</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-600">{cltCount}</p>
                        <p className="text-xs text-gray-500">CLT</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-50">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-orange-600">{pjCount}</p>
                        <p className="text-xs text-gray-500">PJ</p>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/30 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="relative w-full sm:w-96">
                            <Input
                                icon={Search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, email ou cargo..."
                                className="shadow-sm bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={showFilters ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filtros
                                {hasActiveFilters && (
                                    <span className="ml-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                        !
                                    </span>
                                )}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="w-4 h-4 mr-1" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos os Status</SelectItem>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Ferias">Férias</SelectItem>
                                    <SelectItem value="Afastado">Afastado</SelectItem>
                                    <SelectItem value="Desligado">Desligado</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger>
                                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Departamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos os Departamentos</SelectItem>
                                    {departmentsList.map((d) => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={contractFilter} onValueChange={setContractFilter}>
                                <SelectTrigger>
                                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Contrato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos os Contratos</SelectItem>
                                    {contractTypes.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Table */}
                {!loading && filteredRows.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
                        <p className="font-medium">Nenhum colaborador encontrado.</p>
                        <p className="text-xs mt-1">
                            {hasActiveFilters ? 'Tente ajustar os filtros.' : 'Cadastre um novo colaborador para começar.'}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Contrato</TableHead>
                                <TableHead>Admissão</TableHead>
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
                                filteredRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => handleRowClick(row.id)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar size="md" className="bg-gradient-to-br from-primary-400 to-primary-600 text-white ring-2 ring-white shadow-sm">
                                                    <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-gray-900">{row.full_name}</p>
                                                    <p className="text-xs text-gray-400">{row.position || row.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                                                {row.department}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {row.contract_type ? (
                                                <Badge variant="neutral" className="rounded-full">
                                                    {row.contract_type}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {row.hire_date
                                                ? new Date(row.hire_date).toLocaleDateString('pt-BR')
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(row.status)}
                                                className="rounded-full px-3 py-1 capitalize font-bold"
                                            >
                                                {row.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/colaboradores/${row.id}`)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/colaboradores/${row.id}/editar`)}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => router.push(`/documentos?collaborator=${row.id}`)}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Ver Documentos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/recessos/novo?collaborator=${row.id}`)}>
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Solicitar Recesso
                                                    </DropdownMenuItem>
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
                    <span className="text-sm text-gray-500">
                        Exibindo {filteredRows.length} de {collaborators.length} colaboradores
                    </span>
                </div>
            </div>
        </div>
    )
}
