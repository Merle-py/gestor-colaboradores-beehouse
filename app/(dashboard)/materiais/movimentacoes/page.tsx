'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, MovementType } from '@/types/database.types'

export default function MovimentacoesPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [items, setItems] = useState<InventoryItem[]>([])
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

    const [form, setForm] = useState({
        item_id: '',
        movement_type: 'entry' as MovementType,
        quantity: '',
        reason: '',
        document_number: '',
        unit_cost: '',
    })

    useEffect(() => {
        const fetchItems = async () => {
            const { data } = await supabase.from('inventory_items').select('*').eq('is_active', true).order('name')
            if (data) setItems(data as InventoryItem[])
        }
        fetchItems()
    }, [])

    const handleItemChange = (itemId: string) => {
        setForm({ ...form, item_id: itemId })
        const item = items.find(i => i.id === itemId)
        setSelectedItem(item || null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const qty = parseInt(form.quantity)
            const isEntry = ['entry', 'return', 'adjustment'].includes(form.movement_type)

            if (!isEntry && selectedItem && qty > selectedItem.quantity_available) {
                throw new Error(`Estoque insuficiente. Disponível: ${selectedItem.quantity_available}`)
            }

            const newQuantity = isEntry
                ? selectedItem!.quantity_available + qty
                : selectedItem!.quantity_available - qty

            // Register movement
            const { error: movError } = await (supabase.from('inventory_movements') as any).insert({
                item_id: form.item_id,
                movement_type: form.movement_type,
                quantity: qty,
                previous_quantity: selectedItem!.quantity_available,
                new_quantity: newQuantity,
                reason: form.reason || null,
                document_number: form.document_number || null,
                unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
            })

            if (movError) throw movError

            // Update stock
            const { error: stockError } = await (supabase.from('inventory_items') as any)
                .update({ quantity_available: newQuantity })
                .eq('id', form.item_id)

            if (stockError) throw stockError

            router.push('/materiais')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getMovementLabel = (type: MovementType) => {
        const labels: Record<MovementType, { label: string; icon: React.ReactNode }> = {
            entry: { label: 'Entrada', icon: <ArrowDownCircle className="w-4 h-4 text-green-600" /> },
            exit: { label: 'Saída', icon: <ArrowUpCircle className="w-4 h-4 text-red-600" /> },
            adjustment: { label: 'Ajuste', icon: null },
            return: { label: 'Devolução', icon: <ArrowDownCircle className="w-4 h-4 text-blue-600" /> },
            loss: { label: 'Perda', icon: <ArrowUpCircle className="w-4 h-4 text-gray-600" /> },
        }
        return labels[type]
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/materiais">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Movimentação de Estoque</h1>
                    <p className="text-gray-500 text-sm">Registre entradas, saídas e ajustes</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Nova Movimentação</CardTitle>
                        <CardDescription>Registre a entrada ou saída de itens</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Item *</label>
                            <Select value={form.item_id} onValueChange={handleItemChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} - Atual: {item.quantity_available} {item.unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedItem && (
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                <p className="font-medium text-gray-800">{selectedItem.name}</p>
                                <p className="text-sm text-gray-600">Estoque atual: <strong>{selectedItem.quantity_available}</strong> {selectedItem.unit}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tipo de Movimentação *</label>
                                <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v as MovementType })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entry">
                                            <span className="flex items-center gap-2">
                                                <ArrowDownCircle className="w-4 h-4 text-green-600" />
                                                Entrada
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="exit">
                                            <span className="flex items-center gap-2">
                                                <ArrowUpCircle className="w-4 h-4 text-red-600" />
                                                Saída
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="return">Devolução</SelectItem>
                                        <SelectItem value="adjustment">Ajuste de Inventário</SelectItem>
                                        <SelectItem value="loss">Perda/Extravio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Quantidade *</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {selectedItem && form.quantity && (
                            <div className={`p-3 rounded-lg ${['entry', 'return', 'adjustment'].includes(form.movement_type) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                                <p className="text-sm">
                                    Estoque após movimentação: <strong>
                                        {['entry', 'return', 'adjustment'].includes(form.movement_type)
                                            ? selectedItem.quantity_available + parseInt(form.quantity || '0')
                                            : selectedItem.quantity_available - parseInt(form.quantity || '0')}
                                    </strong> {selectedItem.unit}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nº Documento</label>
                                <Input
                                    value={form.document_number}
                                    onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                                    placeholder="Ex: NF-12345"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Custo Unitário (R$)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.unit_cost}
                                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Motivo</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={2}
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="Descreva o motivo da movimentação..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/materiais">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !form.item_id || !form.quantity}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Registrar Movimentação
                    </Button>
                </div>
            </form>
        </div>
    )
}
