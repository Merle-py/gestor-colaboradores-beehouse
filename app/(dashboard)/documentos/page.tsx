'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    RefreshCw,
    Search,
    MoreHorizontal,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    Settings
} from 'lucide-react'
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
import type { CollaboratorDocument, DocumentStatus } from '@/types/database.types'

export default function DocumentosPage() {
    const supabase = createClient()
    const [documents, setDocuments] = useState<(CollaboratorDocument & { collaborator?: { full_name: string } })[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('Todos')

    const fetchDocuments = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('collaborator_documents')
            .select('*, collaborator:collaborators(full_name)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            setDocuments([])
        } else {
            setDocuments(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.document_name.toLowerCase().includes(search.toLowerCase()) ||
            doc.collaborator?.full_name?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'Todos' || doc.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: DocumentStatus) => {
        const config: Record<DocumentStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral'; icon: React.ReactNode }> = {
            pending: { label: 'Pendente', variant: 'warning', icon: <Clock className="w-3 h-3" /> },
            uploaded: { label: 'Enviado', variant: 'neutral', icon: <Upload className="w-3 h-3" /> },
            approved: { label: 'Aprovado', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
            rejected: { label: 'Rejeitado', variant: 'error', icon: <XCircle className="w-3 h-3" /> },
            expired: { label: 'Expirado', variant: 'error', icon: <Clock className="w-3 h-3" /> },
        }
        const c = config[status]
        return (
            <Badge variant={c.variant} className="rounded-full font-bold flex items-center gap-1 w-fit">
                {c.icon}
                {c.label}
            </Badge>
        )
    }

    const pendingCount = documents.filter(d => d.status === 'pending').length
    const uploadedCount = documents.filter(d => d.status === 'uploaded').length

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admissão & Documentos</h1>
                    <p className="text-gray-500 mt-2">Gestão eletrônica de documentos e checklists de admissão.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchDocuments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/documentos/checklist">
                        <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Checklist
                        </Button>
                    </Link>
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
                    <div className="p-2 rounded-lg bg-amber-50">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                        <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{uploadedCount}</p>
                        <p className="text-xs text-gray-500">Aguardando Revisão</p>
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
                            placeholder="Buscar por documento ou colaborador..."
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
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="uploaded">Enviado</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!loading && filteredDocuments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">Nenhum documento encontrado.</p>
                        <p className="text-xs mt-1">Os documentos aparecerão aqui após novas admissões.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Enviado em</TableHead>
                                <TableHead>Tipo</TableHead>
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
                                filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <p className="font-bold text-gray-900">{doc.collaborator?.full_name || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800">{doc.document_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {doc.uploaded_at
                                                ? new Date(doc.uploaded_at).toLocaleDateString('pt-BR')
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {doc.file_type || '-'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {doc.cloud_url && (
                                                        <DropdownMenuItem onClick={() => window.open(doc.cloud_url!, '_blank')}>
                                                            Ver documento
                                                        </DropdownMenuItem>
                                                    )}
                                                    {doc.status === 'uploaded' && (
                                                        <>
                                                            <DropdownMenuItem className="text-green-600">Aprovar</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600">Rejeitar</DropdownMenuItem>
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
                    <span className="text-sm text-gray-500">Total: {filteredDocuments.length} documentos</span>
                </div>
            </div>
        </div>
    )
}
