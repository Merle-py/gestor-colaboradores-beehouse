'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    RefreshCw,
    Search,
    MoreHorizontal,
    Package,
    ArrowLeft,
    Edit,
    Trash2,
    Save,
    X,
    Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { InventoryItem, ItemCategory } from '@/types/database.types'

const categories: ItemCategory[] = ['EPI', 'Uniforme', 'Ferramenta', 'TI', 'Escritório', 'Outro']

export default function EstoquePage() {
    const supabase = createClient()
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        category: 'EPI' as ItemCategory,
        quantity_available: 0,
        min_stock: 5,
        unit: 'unidade',
        ca_number: '',
        ca_expiration: '',
    })

    const fetchItems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (!error && data) {
            setItems(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            sku: '',
            category: 'EPI',
            quantity_available: 0,
            min_stock: 5,
            unit: 'unidade',
            ca_number: '',
            ca_expiration: '',
        })
        setEditingItem(null)
    }

    const openEditDialog = (item: InventoryItem) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            description: item.description || '',
            sku: item.sku || '',
            category: item.category,
            quantity_available: item.quantity_available,
            min_stock: item.min_stock,
            unit: item.unit,
            ca_number: item.ca_number || '',
            ca_expiration: item.ca_expiration || '',
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            if (editingItem) {
                // Update
                await supabase
                    .from('inventory_items')
                    .update({
                        name: formData.name,
                        description: formData.description || null,
                        sku: formData.sku || null,
                        category: formData.category,
                        quantity_available: formData.quantity_available,
                        min_stock: formData.min_stock,
                        unit: formData.unit,
                        ca_number: formData.ca_number || null,
                        ca_expiration: formData.ca_expiration || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingItem.id)
            } else {
                // Insert
                await supabase
                    .from('inventory_items')
                    .insert({
                        name: formData.name,
                        description: formData.description || null,
                        sku: formData.sku || null,
                        category: formData.category,
                        quantity_available: formData.quantity_available,
                        min_stock: formData.min_stock,
                        unit: formData.unit,
                        ca_number: formData.ca_number || null,
                        ca_expiration: formData.ca_expiration || null,
                        is_active: true,
                    })
            }

            await fetchItems()
            setDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error('Error saving item:', error)
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja desativar este item?')) return

        await supabase
            .from('inventory_items')
            .update({ is_active: false })
            .eq('id', id)

        fetchItems()
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
    )

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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/materiais">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Estoque</h1>
                        <p className="text-gray-500 mt-1">Gerenciar itens do estoque</p>
                    </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Nome *</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Nome do item"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Categoria</label>
                                    <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v as ItemCategory }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SKU</label>
                                    <Input
                                        value={formData.sku}
                                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Quantidade</label>
                                    <Input
                                        type="number"
                                        value={formData.quantity_available}
                                        onChange={(e) => setFormData(p => ({ ...p, quantity_available: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Estoque Mínimo</label>
                                    <Input
                                        type="number"
                                        value={formData.min_stock}
                                        onChange={(e) => setFormData(p => ({ ...p, min_stock: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Unidade</label>
                                    <Select value={formData.unit} onValueChange={(v) => setFormData(p => ({ ...p, unit: v }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unidade">Unidade</SelectItem>
                                            <SelectItem value="par">Par</SelectItem>
                                            <SelectItem value="caixa">Caixa</SelectItem>
                                            <SelectItem value="pacote">Pacote</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nº CA (EPI)</label>
                                    <Input
                                        value={formData.ca_number}
                                        onChange={(e) => setFormData(p => ({ ...p, ca_number: e.target.value }))}
                                        placeholder="12345"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Validade CA</label>
                                    <Input
                                        type="date"
                                        value={formData.ca_expiration}
                                        onChange={(e) => setFormData(p => ({ ...p, ca_expiration: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Descrição</label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Descrição opcional"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={saving || !formData.name}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="w-full max-w-md">
                <Input
                    icon={Search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou SKU..."
                />
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum item encontrado</p>
                    <p className="text-gray-400 text-sm">Cadastre um novo item para começar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const stockOk = item.quantity_available > item.min_stock
                        return (
                            <Card key={item.id} className={!stockOk ? 'border-orange-200 bg-orange-50/30' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                                                    {item.category}
                                                </span>
                                                {item.sku && <span className="text-xs text-gray-400 font-mono">{item.sku}</span>}
                                            </div>
                                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                                            {item.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-extrabold text-gray-900">
                                                {item.quantity_available}
                                                <span className="text-sm font-normal text-gray-400 ml-1">{item.unit}</span>
                                            </p>
                                            <p className="text-xs text-gray-500">Mín: {item.min_stock}</p>
                                        </div>
                                        <Badge variant={stockOk ? 'success' : 'warning'}>
                                            {stockOk ? 'Em estoque' : 'Baixo'}
                                        </Badge>
                                    </div>
                                    {item.ca_number && (
                                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                            CA: {item.ca_number}
                                            {item.ca_expiration && ` • Val: ${new Date(item.ca_expiration).toLocaleDateString('pt-BR')}`}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
