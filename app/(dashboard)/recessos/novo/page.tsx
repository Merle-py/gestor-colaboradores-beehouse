'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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
import type { RecessType, RecessCategory } from '@/types/database.types'

export default function NovoRecessoPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [collaborators, setCollaborators] = useState<{ id: string; full_name: string }[]>([])

    const [form, setForm] = useState({
        collaborator_id: '',
        request_type: 'individual' as RecessType,
        category: '' as RecessCategory,
        start_date: '',
        end_date: '',
        reason: '',
        notes: '',
    })

    useEffect(() => {
        const fetchCollaborators = async () => {
            const { data } = await supabase.from('collaborators').select('id, full_name').eq('status', 'ativo').order('full_name')
            if (data) setCollaborators(data)
        }
        fetchCollaborators()
    }, [])

    const calcDays = () => {
        if (!form.start_date || !form.end_date) return 0
        const start = new Date(form.start_date)
        const end = new Date(form.end_date)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await (supabase.from('recess_requests') as any).insert({
                collaborator_id: form.collaborator_id,
                request_type: form.request_type,
                category: form.category || null,
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason || null,
                notes: form.notes || null,
                status: 'requested',
            })

            if (insertError) throw insertError

            router.push('/recessos')
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
                <Link href="/recessos">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação de Recesso</h1>
                    <p className="text-gray-500 text-sm">Solicite férias, licença ou recesso</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Solicitação</CardTitle>
                        <CardDescription>Preencha as informações do recesso</CardDescription>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                                <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v as RecessType })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="collective">Coletivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Categoria</label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as RecessCategory })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vacation">Férias</SelectItem>
                                        <SelectItem value="recess">Recesso</SelectItem>
                                        <SelectItem value="leave">Licença</SelectItem>
                                        <SelectItem value="medical">Médica</SelectItem>
                                        <SelectItem value="maternity">Maternidade</SelectItem>
                                        <SelectItem value="paternity">Paternidade</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Data Início *</label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Data Fim *</label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {form.start_date && form.end_date && (
                            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                                <p className="text-sm font-medium text-primary-800">
                                    Total: <span className="text-lg font-bold">{calcDays()}</span> dias
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Motivo</label>
                            <Input
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="Ex: Férias anuais"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Observações</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={3}
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Observações adicionais..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/recessos">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !form.collaborator_id || !form.start_date || !form.end_date}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enviar Solicitação
                    </Button>
                </div>
            </form>
        </div>
    )
}
