'use client'

import { useRouter } from 'next/navigation'
import { Clock, FileText, Calendar, Package, Banknote, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PendingAction, ActionStatus, ModuleType } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface PendingActionsTableProps {
    actions: PendingAction[]
    loading?: boolean
    onActionClick?: (action: PendingAction) => void
    maxRows?: number
}

const statusConfig: Record<ActionStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    pending: { label: 'Pendente', variant: 'neutral' },
    in_review: { label: 'Em Análise', variant: 'warning' },
    urgent: { label: 'Urgente', variant: 'error' },
    completed: { label: 'Concluído', variant: 'success' },
}

const moduleConfig: Record<ModuleType, { icon: React.ReactNode; color: string }> = {
    Documentos: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
    Contratos: { icon: <FileText className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
    Recessos: { icon: <Calendar className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
    Materiais: { icon: <Package className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50' },
    Financeiro: { icon: <Banknote className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
}

export function PendingActionsTable({
    actions,
    loading = false,
    onActionClick,
    maxRows = 10
}: PendingActionsTableProps) {
    const router = useRouter()
    const displayActions = actions.slice(0, maxRows)

    const handleNavigate = (action: PendingAction) => {
        const moduleRoutes: Record<ModuleType, string> = {
            Documentos: '/documentos',
            Contratos: '/contratos',
            Recessos: '/recessos',
            Materiais: '/materiais',
            Financeiro: '/financeiro',
        }
        router.push(moduleRoutes[action.module])
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
                <div className="flex items-center justify-center h-48">
                    <Clock className="w-8 h-8 text-gray-300 animate-pulse" />
                </div>
            </div>
        )
    }

    if (actions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Tudo em dia!</h3>
                    <p className="text-gray-500 text-sm mt-1">Não há pendências no momento.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">Pendências</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{actions.length} ações aguardando</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/pendencias')}>
                    Ver todas
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[40%]">Ação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayActions.map((action) => {
                        const status = statusConfig[action.status]
                        const module = moduleConfig[action.module]

                        return (
                            <TableRow
                                key={action.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => onActionClick?.(action)}
                            >
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-gray-900">{action.title}</p>
                                        {action.collaborator && (
                                            <p className="text-xs text-gray-500">{action.collaborator.full_name}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={status.variant}
                                        className="rounded-full text-xs font-bold"
                                    >
                                        {status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className={cn(
                                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                                        module.color
                                    )}>
                                        {module.icon}
                                        {action.module}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {action.due_date ? (
                                        <span className="text-sm text-gray-600">
                                            {new Date(action.due_date).toLocaleDateString('pt-BR')}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleNavigate(action)}>
                                                Ir para {action.module}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>Marcar como concluído</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {actions.length > maxRows && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/30 text-center">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/pendencias')}>
                        Ver mais {actions.length - maxRows} pendências
                    </Button>
                </div>
            )}
        </div>
    )
}
