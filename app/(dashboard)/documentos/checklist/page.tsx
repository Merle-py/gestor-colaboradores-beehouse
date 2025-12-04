'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Loader2,
    FileText,
    CheckCircle,
    AlertCircle,
    GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface ChecklistItem {
    id: string
    document_name: string
    description: string | null
    is_required: boolean
    category: string | null
    display_order: number
}

const categories = [
    'Identificação',
    'Trabalhista',
    'Saúde',
    'Bancário',
    'Outros',
]

export default function ChecklistPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState<ChecklistItem[]>([])
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // New item form
    const [newItem, setNewItem] = useState({
        document_name: '',
        description: '',
        is_required: true,
        category: 'Identificação',
    })

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('document_checklists')
            .select('*')
            .order('display_order', { ascending: true })

        if (data) setItems(data as ChecklistItem[])
        setLoading(false)
    }

    const handleAddItem = async () => {
        if (!newItem.document_name.trim()) {
            setFeedback({ message: 'Nome do documento é obrigatório', type: 'error' })
            return
        }

        setSaving(true)
        const { error } = await (supabase.from('document_checklists') as any).insert({
            document_name: newItem.document_name,
            description: newItem.description || null,
            is_required: newItem.is_required,
            category: newItem.category,
            display_order: items.length + 1,
        })

        if (error) {
            setFeedback({ message: 'Erro ao adicionar: ' + error.message, type: 'error' })
        } else {
            setFeedback({ message: 'Documento adicionado com sucesso!', type: 'success' })
            setNewItem({ document_name: '', description: '', is_required: true, category: 'Identificação' })
            fetchItems()
        }
        setSaving(false)
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este documento do checklist?')) return

        const { error } = await supabase.from('document_checklists').delete().eq('id', id)
        if (error) {
            setFeedback({ message: 'Erro ao remover: ' + error.message, type: 'error' })
        } else {
            setItems(items.filter((i) => i.id !== id))
            setFeedback({ message: 'Documento removido!', type: 'success' })
        }
    }

    const handleToggleRequired = async (id: string, current: boolean) => {
        const { error } = await (supabase.from('document_checklists') as any)
            .update({ is_required: !current })
            .eq('id', id)

        if (!error) {
            setItems(items.map((i) => (i.id === id ? { ...i, is_required: !current } : i)))
        }
    }

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'Outros'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {} as Record<string, ChecklistItem[]>)

    const requiredCount = items.filter((i) => i.is_required).length
    const optionalCount = items.length - requiredCount

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/documentos">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Checklist de Documentos</h1>
                    <p className="text-gray-500">Gerencie os documentos obrigatórios para admissão</p>
                </div>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{items.length}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">{requiredCount}</p>
                    <p className="text-xs text-green-600">Obrigatórios</p>
                </div>
                <div className="bg-gray-50 rounded-xl border p-4 text-center">
                    <p className="text-3xl font-bold text-gray-600">{optionalCount}</p>
                    <p className="text-xs text-gray-500">Opcionais</p>
                </div>
            </div>

            {/* Add New */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary-500" />
                        Adicionar Documento
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome do Documento *</label>
                            <Input
                                value={newItem.document_name}
                                onChange={(e) => setNewItem({ ...newItem, document_name: e.target.value })}
                                placeholder="Ex: RG, CPF, CTPS..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria</label>
                            <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Descrição (opcional)</label>
                            <Input
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Instruções ou observações..."
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_required"
                                checked={newItem.is_required}
                                onChange={(e) => setNewItem({ ...newItem, is_required: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor="is_required" className="text-sm">Documento obrigatório</label>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleAddItem} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Checklist by Category */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum documento no checklist</p>
                    <p className="text-xs text-gray-400">Adicione documentos usando o formulário acima</p>
                </div>
            ) : (
                Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>{category}</span>
                                <Badge variant="neutral">{categoryItems.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {categoryItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-gray-300" />
                                        {item.is_required ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-gray-300" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{item.document_name}</p>
                                            {item.description && (
                                                <p className="text-xs text-gray-500">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleRequired(item.id, item.is_required)}
                                        >
                                            {item.is_required ? 'Tornar Opcional' : 'Tornar Obrigatório'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}
