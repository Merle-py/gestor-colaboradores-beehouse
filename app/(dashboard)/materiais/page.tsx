'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    RefreshCw,
    Search,
    MoreHorizontal,
    Package,
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
    Eye,
    Edit,
    ArrowRightLeft,
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
import type { InventoryItem, ItemCategory } from '@/types/database.types'

export default function MateriaisPage() {
    const supabase = createClient()
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('Todos')

    const fetchItems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) {
            console.error(error)
            setItems([])
        } else {
            setItems(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = categoryFilter === 'Todos' || item.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const lowStockItems = items.filter(i => i.quantity_available <= i.min_stock)
    const caExpiringItems = items.filter(i => {
        if (!i.ca_expiration) return false
        const days = Math.ceil((new Date(i.ca_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days <= 30 && days > 0
    })

    const getCategoryColor = (category: ItemCategory) => {
        const colors: Record<ItemCategory, string> = {
            EPI: 'bg-orange-100 text-orange-700',
            Uniforme: 'bg-blue-100 text-blue-700',
            Ferramenta: 'bg-purple-100 text-purple-700',
            TI: 'bg-green-100 text-green-700',
            Escritório: 'bg-gray-100 text-gray-700',
            Outro: 'bg-zinc-100 text-zinc-700',
        }
        return colors[category] || colors.Outro
    }

    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity_available === 0) return { label: 'Sem Estoque', variant: 'error' as const }
        if (item.quantity_available <= item.min_stock) return { label: 'Baixo', variant: 'warning' as const }
        return { label: 'OK', variant: 'success' as const }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Materiais & EPIs</h1>
                    <p className="text-gray-500 mt-2">Controle de estoque, entregas e certificados.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchItems} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/materiais/estoque">
                        <Button variant="outline">
                            <Boxes className="w-4 h-4 mr-2" />
                            Ver Estoque
                        </Button>
                    </Link>
                    <Link href="/materiais/entregas">
                        <Button className="shadow-lg shadow-primary-500/30 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Lançar Entrega
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStockItems.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <Package className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-bold text-amber-800">{lowStockItems.length} itens com estoque baixo</p>
                            <p className="text-sm text-amber-700">Verifique a necessidade de reposição.</p>
                        </div>
                    </div>
                )}
                {caExpiringItems.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                            <p className="font-bold text-red-800">{caExpiringItems.length} EPIs com CA vencendo</p>
                            <p className="text-sm text-red-700">Certificados de Aprovação próximos do vencimento.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/materiais/movimentacoes" className="bg-white rounded-xl border border-gray-100 shadow-md p-4 hover:shadow-lg transition-shadow flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                        <ArrowDownCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Entrada</p>
                        <p className="text-xs text-gray-500">Registrar entrada</p>
                    </div>
                </Link>
                <Link href="/materiais/movimentacoes" className="bg-white rounded-xl border border-gray-100 shadow-md p-4 hover:shadow-lg transition-shadow flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50">
                        <ArrowUpCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Saída</p>
                        <p className="text-xs text-gray-500">Registrar saída</p>
                    </div>
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Input
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou SKU..."
                            className="shadow-sm bg-white"
                        />
                    </div>
                    <div className="w-40">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todas</SelectItem>
                                <SelectItem value="EPI">EPI</SelectItem>
                                <SelectItem value="Uniforme">Uniforme</SelectItem>
                                <SelectItem value="Ferramenta">Ferramenta</SelectItem>
                                <SelectItem value="TI">TI</SelectItem>
                                <SelectItem value="Escritório">Escritório</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!loading && filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">Nenhum item encontrado.</p>
                        <p className="text-xs mt-1">Cadastre itens no estoque para começar.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Disponível</TableHead>
                                <TableHead>Estoque Mín.</TableHead>
                                <TableHead>CA</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const stockStatus = getStockStatus(item)
                                    const caExpiring = item.ca_expiration &&
                                        Math.ceil((new Date(item.ca_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30

                                    return (
                                        <TableRow key={item.id} className={stockStatus.variant === 'error' ? 'bg-red-50/50' : stockStatus.variant === 'warning' ? 'bg-amber-50/50' : ''}>
                                            <TableCell>
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 font-mono">{item.sku || '-'}</TableCell>
                                            <TableCell>
                                                <span className="text-lg font-bold text-gray-900">{item.quantity_available}</span>
                                                <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{item.min_stock}</TableCell>
                                            <TableCell>
                                                {item.ca_number ? (
                                                    <div className={caExpiring ? 'text-red-600' : 'text-gray-600'}>
                                                        <p className="text-xs font-mono">{item.ca_number}</p>
                                                        {item.ca_expiration && (
                                                            <p className="text-xs">
                                                                {new Date(item.ca_expiration).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={stockStatus.variant} className="rounded-full font-bold">
                                                    {stockStatus.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <Link href={`/materiais/estoque`}>
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Ver detalhes
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link href={`/materiais/estoque`}>
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Editar item
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link href="/materiais/movimentacoes">
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                                Registrar movimento
                                                            </DropdownMenuItem>
                                                        </Link>
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
                    <span className="text-sm text-gray-500">Total: {filteredItems.length} itens</span>
                </div>
            </div>
        </div>
    )
}
