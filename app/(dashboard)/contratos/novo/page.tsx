'use client'

import { useState } from 'react'
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
import type { ContractType } from '@/types/database.types'

export default function NovoContratoPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState({
        collaborator_id: '',
        contract_type: '' as ContractType,
        contract_number: '',
        start_date: '',
        end_date: '',
        renewal_date: '',
        monthly_value: '',
        payment_day: '',
        work_hours_per_week: '40',
        notes: '',
    })

    const [collaborators, setCollaborators] = useState<{ id: string; full_name: string }[]>([])

    // Fetch collaborators on mount
    useState(() => {
        const fetchCollaborators = async () => {
            const { data } = await supabase.from('collaborators').select('id, full_name').order('full_name')
            if (data) setCollaborators(data)
        }
        fetchCollaborators()
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await (supabase.from('contracts') as any).insert({
                collaborator_id: form.collaborator_id,
                contract_type: form.contract_type,
                contract_number: form.contract_number || null,
                start_date: form.start_date,
                end_date: form.end_date || null,
                renewal_date: form.renewal_date || null,
                monthly_value: form.monthly_value ? parseFloat(form.monthly_value) : null,
                payment_day: form.payment_day ? parseInt(form.payment_day) : null,
                work_hours_per_week: parseInt(form.work_hours_per_week),
                notes: form.notes || null,
                status: 'active',
            })

            if (insertError) throw insertError

            router.push('/contratos')
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
                <Link href="/contratos">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Contrato</h1>
                    <p className="text-gray-500 text-sm">Cadastre um novo contrato de trabalho</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Contrato</CardTitle>
                        <CardDescription>Preencha as informações do contrato</CardDescription>
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
                                <label className="text-sm font-medium text-gray-700">Tipo de Contrato *</label>
                                <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v as ContractType })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLT">CLT</SelectItem>
                                        <SelectItem value="PJ">PJ</SelectItem>
                                        <SelectItem value="Estagiário">Estagiário</SelectItem>
                                        <SelectItem value="Temporário">Temporário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nº do Contrato</label>
                                <Input
                                    value={form.contract_number}
                                    onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                                    placeholder="Ex: 2024/001"
                                />
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
                                <label className="text-sm font-medium text-gray-700">Data Término</label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Valor Mensal (R$)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.monthly_value}
                                    onChange={(e) => setForm({ ...form, monthly_value: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Dia do Pagamento</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={form.payment_day}
                                    onChange={(e) => setForm({ ...form, payment_day: e.target.value })}
                                    placeholder="5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Horas Semanais</label>
                            <Input
                                type="number"
                                value={form.work_hours_per_week}
                                onChange={(e) => setForm({ ...form, work_hours_per_week: e.target.value })}
                                placeholder="40"
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
                    <Link href="/contratos">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !form.collaborator_id || !form.contract_type || !form.start_date}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Contrato
                    </Button>
                </div>
            </form>
        </div>
    )
}
