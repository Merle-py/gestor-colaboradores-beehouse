'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react'
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
import type { InventoryItem } from '@/types/database.types'

export default function EntregaMaterialPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [collaborators, setCollaborators] = useState<{ id: string; full_name: string }[]>([])
    const [items, setItems] = useState<InventoryItem[]>([])
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

    const [form, setForm] = useState({
        collaborator_id: '',
        item_id: '',
        quantity: '1',
        size: '',
        delivery_date: new Date().toISOString().split('T')[0],
        notes: '',
        digital_signature: false,
    })

    useEffect(() => {
        const fetchData = async () => {
            const [collabRes, itemsRes] = await Promise.all([
                supabase.from('collaborators').select('id, full_name').eq('status', 'ativo').order('full_name'),
                supabase.from('inventory_items').select('*').eq('is_active', true).gt('quantity_available', 0).order('name'),
            ])
            if (collabRes.data) setCollaborators(collabRes.data)
            if (itemsRes.data) setItems(itemsRes.data as InventoryItem[])
        }
        fetchData()
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

            // Check stock
            if (selectedItem && qty > selectedItem.quantity_available) {
                throw new Error(`Estoque insuficiente. Disponível: ${selectedItem.quantity_available}`)
            }

            // Calculate next replacement date
            let nextReplacementDate = null
            if (selectedItem?.replacement_cycle_days) {
                const date = new Date(form.delivery_date)
                date.setDate(date.getDate() + selectedItem.replacement_cycle_days)
                nextReplacementDate = date.toISOString().split('T')[0]
            }

            // Insert delivery
            const { error: insertError } = await (supabase.from('epi_deliveries') as any).insert({
                collaborator_id: form.collaborator_id,
                item_id: form.item_id,
                quantity: qty,
                size: form.size || null,
                delivery_date: form.delivery_date,
                next_replacement_date: nextReplacementDate,
                ca_at_delivery: selectedItem?.ca_number || null,
                digital_signature: form.digital_signature,
                notes: form.notes || null,
            })

            if (insertError) throw insertError

            // Update stock
            const { error: stockError } = await (supabase.from('inventory_items') as any)
                .update({ quantity_available: selectedItem!.quantity_available - qty })
                .eq('id', form.item_id)

            if (stockError) throw stockError

            // Register movement
            await (supabase.from('inventory_movements') as any).insert({
                item_id: form.item_id,
                movement_type: 'exit',
                quantity: qty,
                previous_quantity: selectedItem!.quantity_available,
                new_quantity: selectedItem!.quantity_available - qty,
                collaborator_id: form.collaborator_id,
                reason: `Entrega de EPI/Material`,
            })

            router.push('/materiais')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Lançar Entrega de Material</h1>
                    <p className="text-gray-500 text-sm">Registre a entrega de EPI ou material ao colaborador</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Dados da Entrega
                        </CardTitle>
                        <CardDescription>Preencha as informações da entrega</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Colaborador *</label>
                            <Select value={form.collaborator_id} onValueChange={(v) => setForm({ ...form, collaborator_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o colaborador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collaborators.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Item *</label>
                            <Select value={form.item_id} onValueChange={handleItemChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} ({item.category}) - Disp: {item.quantity_available}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedItem && (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                                <p className="font-medium text-blue-800">{selectedItem.name}</p>
                                <p className="text-blue-600">Disponível: {selectedItem.quantity_available} {selectedItem.unit}</p>
                                {selectedItem.ca_number && (
                                    <p className="text-blue-600">CA: {selectedItem.ca_number}</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Quantidade *</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max={selectedItem?.quantity_available || 999}
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tamanho</label>
                                <Input
                                    value={form.size}
                                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                                    placeholder="Ex: M, G, 42"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Data *</label>
                                <Input
                                    type="date"
                                    value={form.delivery_date}
                                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Observações</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={2}
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Observações..."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="signature"
                                checked={form.digital_signature}
                                onChange={(e) => setForm({ ...form, digital_signature: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor="signature" className="text-sm text-gray-700">
                                Colaborador confirmou recebimento (assinatura digital)
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/materiais">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !form.collaborator_id || !form.item_id}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Registrar Entrega
                    </Button>
                </div>
            </form>
        </div>
    )
}
