'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Calendar,
    Users,
    Check,
    Loader2,
    Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

interface Collaborator {
    id: string
    full_name: string
    department: string
    status: string
    selected?: boolean
}

export default function RecessoColetivoPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [selectAll, setSelectAll] = useState(false)

    const [form, setForm] = useState({
        start_date: '',
        end_date: '',
        reason: 'Recesso Coletivo',
        notes: '',
    })

    useEffect(() => {
        fetchCollaborators()
    }, [])

    const fetchCollaborators = async () => {
        const { data } = await (supabase.from('collaborators') as any)
            .select('id, full_name, department, status')
            .eq('status', 'ativo')
            .order('full_name')

        if (data) {
            setCollaborators(data.map((c: any) => ({ ...c, selected: false })))
        }
        setLoading(false)
    }

    const handleSelectAll = () => {
        const newValue = !selectAll
        setSelectAll(newValue)
        setCollaborators(collaborators.map((c) => ({ ...c, selected: newValue })))
    }

    const handleSelectCollaborator = (id: string) => {
        setCollaborators(collaborators.map((c) =>
            c.id === id ? { ...c, selected: !c.selected } : c
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const selected = collaborators.filter((c) => c.selected)

        if (selected.length === 0) {
            setFeedback({ message: 'Selecione pelo menos um colaborador', type: 'error' })
            return
        }

        if (!form.start_date || !form.end_date) {
            setFeedback({ message: 'Preencha as datas do recesso', type: 'error' })
            return
        }

        setSaving(true)
        setFeedback(null)

        try {
            const recesses = selected.map((c) => ({
                collaborator_id: c.id,
                request_type: 'collective',
                category: 'recess',
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason,
                notes: form.notes || null,
                status: 'approved',
            }))

            const { error } = await (supabase.from('recess_requests') as any).insert(recesses)
            if (error) throw error

            setFeedback({
                message: `Recesso coletivo criado para ${selected.length} colaboradores!`,
                type: 'success',
            })

            setForm({ start_date: '', end_date: '', reason: 'Recesso Coletivo', notes: '' })
            setCollaborators(collaborators.map((c) => ({ ...c, selected: false })))
            setSelectAll(false)
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const selectedCount = collaborators.filter((c) => c.selected).length

    const calcDays = () => {
        if (!form.start_date || !form.end_date) return 0
        const start = new Date(form.start_date)
        const end = new Date(form.end_date)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    const departments = [...new Set(collaborators.map((c) => c.department))]

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/recessos">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recesso Coletivo</h1>
                    <p className="text-gray-500">Programe recesso para múltiplos colaboradores</p>
                </div>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Período do Recesso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Início *</label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Fim *</label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                {form.start_date && form.end_date && (
                                    <div className="p-3 w-full rounded-lg bg-primary-50 border border-primary-200 text-center">
                                        <span className="text-2xl font-bold text-primary-700">{calcDays()}</span>
                                        <span className="text-sm text-primary-600 ml-1">dias</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="text-sm font-medium">Motivo</label>
                            <Input
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="Ex: Recesso de fim de ano"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-500" />
                                Selecionar Colaboradores
                            </CardTitle>
                            <CardDescription>
                                {selectedCount} de {collaborators.length} selecionados
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={handleSelectAll}>
                            {selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {departments.map((dept) => (
                                    <div key={dept}>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2">{dept}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {collaborators
                                                .filter((c) => c.department === dept)
                                                .map((c) => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => handleSelectCollaborator(c.id)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${c.selected
                                                            ? 'bg-primary-50 border-primary-300'
                                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-5 h-5 rounded border flex items-center justify-center ${c.selected
                                                                ? 'bg-primary-500 border-primary-500'
                                                                : 'border-gray-300'
                                                                }`}
                                                        >
                                                            {c.selected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className="font-medium">{c.full_name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/recessos">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={saving || selectedCount === 0}>
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Programar Recesso ({selectedCount})
                    </Button>
                </div>
            </form>
        </div>
    )
}
