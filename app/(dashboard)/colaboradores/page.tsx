'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, Plus, Search, MoreHorizontal, Pencil, Users } from 'lucide-react'
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface Collaborator {
    id: string
    full_name: string
    email: string
    department: string
    status: string
}

export default function ColaboradoresPage() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Todos')
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
                    status: c.status || 'ativo',
                }))
            )
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCollaborators()
    }, [])

    const filteredRows = collaborators.filter((p) => {
        const s = search.toLowerCase()
        const matchesSearch =
            p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s)
        const matchesStatus =
            statusFilter === 'Todos' || p.status === statusFilter.toLowerCase()
        return matchesSearch && matchesStatus
    })

    const getStatusVariant = (status: string) => {
        if (status === 'ativo') return 'success'
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Colaboradores
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Gerencie o quadro de funcionários, contratos e status.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchCollaborators}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/colaboradores/novo">
                        <Button className="shadow-lg shadow-[#f9b410]/30 hover:shadow-[#f9b410]/40 transition-all text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Colaborador
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Input
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
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
                                <SelectItem value="Ativo">Ativo</SelectItem>
                                <SelectItem value="Afastado">Afastado</SelectItem>
                                <SelectItem value="Desligado">Desligado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!loading && filteredRows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
                        <p>Nenhum colaborador encontrado.</p>
                        <p className="text-xs mt-1">
                            Verifique se você criou o registro e se o banco está conectado.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar size="md" className="bg-[#fff0c8] text-[#8d4c08] ring-2 ring-white shadow-sm">
                                                    <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-gray-900">{row.full_name}</p>
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        {row.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                                                {row.department}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(row.status)}
                                                className="rounded-full px-3 py-1 capitalize font-bold"
                                            >
                                                {row.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.push(`/colaboradores/${row.id}`)
                                                            }
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <span className="text-sm text-gray-500">
                        Total: {filteredRows.length}
                    </span>
                </div>
            </div>
        </div>
    )
}
