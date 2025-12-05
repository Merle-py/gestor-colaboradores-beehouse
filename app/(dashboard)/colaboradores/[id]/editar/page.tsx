'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    Phone,
    CreditCard,
    Building2,
    Briefcase,
    MapPin,
    Loader2,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

const departmentsList = [
    'Administrativo', 'Comercial', 'Financeiro', 'Marketing',
    'Operacional', 'RH', 'TI', 'Jurídico', 'Engenharia',
]

const statusList = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'ferias', label: 'Férias' },
    { value: 'afastado', label: 'Afastado' },
    { value: 'desligado', label: 'Desligado' },
]

export default function EditarColaboradorPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        cpf: '',
        rg: '',
        birth_date: '',
        department: '',
        position: '',
        contract_type: '',
        hire_date: '',
        status: 'ativo',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        pix_key: '',
    })

    useEffect(() => {
        const fetchCollaborator = async () => {
            if (!params.id) return
            const { data, error } = await (supabase.from('collaborators') as any)
                .select('*')
                .eq('id', params.id)
                .single()

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    cpf: data.cpf || '',
                    rg: data.rg || '',
                    birth_date: data.birth_date || '',
                    department: data.department || '',
                    position: data.position || '',
                    contract_type: data.contract_type || '',
                    hire_date: data.hire_date || '',
                    status: data.status || 'ativo',
                    address_street: data.address_street || '',
                    address_city: data.address_city || '',
                    address_state: data.address_state || '',
                    address_zip: data.address_zip || '',
                    bank_name: data.bank_name || '',
                    bank_agency: data.bank_agency || '',
                    bank_account: data.bank_account || '',
                    pix_key: data.pix_key || '',
                })
            }
            setLoading(false)
        }
        fetchCollaborator()
    }, [params.id])

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.')) return

        setDeleting(true)
        try {
            const token = localStorage.getItem('auth_token')
            const res = await fetch(`/api/collaborators?id=${params.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()
            if (data.success) {
                router.push('/colaboradores')
            } else {
                setFeedback({ message: 'Erro ao excluir: ' + data.error, type: 'error' })
            }
        } catch (error: any) {
            setFeedback({ message: 'Erro ao excluir: ' + error.message, type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setFeedback(null)

        try {
            const { error } = await (supabase.from('collaborators') as any)
                .update({
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    cpf: formData.cpf || null,
                    rg: formData.rg || null,
                    birth_date: formData.birth_date || null,
                    department: formData.department || null,
                    position: formData.position || null,
                    contract_type: formData.contract_type || null,
                    hire_date: formData.hire_date || null,
                    status: formData.status,
                    address_street: formData.address_street || null,
                    address_city: formData.address_city || null,
                    address_state: formData.address_state || null,
                    address_zip: formData.address_zip || null,
                    bank_name: formData.bank_name || null,
                    bank_agency: formData.bank_agency || null,
                    bank_account: formData.bank_account || null,
                    pix_key: formData.pix_key || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id as string)

            if (error) throw error

            setFeedback({ message: 'Colaborador atualizado com sucesso!', type: 'success' })
            setTimeout(() => router.push(`/colaboradores/${params.id}`), 1000)
        } catch (e: any) {
            setFeedback({ message: 'Erro: ' + e.message, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/colaboradores/${params.id}`}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editar Colaborador</h1>
                    <p className="text-gray-500">{formData.full_name}</p>
                </div>
            </div>

            {feedback && (
                <div className="mb-6">
                    <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                        {feedback.message}
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo *</label>
                            <Input
                                icon={User}
                                value={formData.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email *</label>
                            <Input
                                icon={Mail}
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telefone</label>
                            <Input
                                icon={Phone}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">CPF</label>
                            <Input
                                icon={CreditCard}
                                value={formData.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">RG</label>
                            <Input
                                value={formData.rg}
                                onChange={(e) => handleChange('rg', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data de Nascimento</label>
                            <Input
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => handleChange('birth_date', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Work Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary-500" />
                            Dados de Trabalho
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Departamento</label>
                            <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
                                <SelectTrigger>
                                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {departmentsList.map((d) => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cargo</label>
                            <Input
                                icon={Briefcase}
                                value={formData.position}
                                onChange={(e) => handleChange('position', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Contrato</label>
                            <Select value={formData.contract_type} onValueChange={(v) => handleChange('contract_type', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
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
                            <label className="text-sm font-medium">Data de Admissão</label>
                            <Input
                                type="date"
                                value={formData.hire_date}
                                onChange={(e) => handleChange('hire_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusList.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            Endereço
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">Rua / Endereço</label>
                            <Input
                                value={formData.address_street}
                                onChange={(e) => handleChange('address_street', e.target.value)}
                                placeholder="Rua, número, complemento"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cidade</label>
                            <Input
                                value={formData.address_city}
                                onChange={(e) => handleChange('address_city', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <Input
                                value={formData.address_state}
                                onChange={(e) => handleChange('address_state', e.target.value)}
                                maxLength={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary-500" />
                            Dados Bancários
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Banco</label>
                            <Input
                                value={formData.bank_name}
                                onChange={(e) => handleChange('bank_name', e.target.value)}
                                placeholder="Ex: Itaú"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Agência</label>
                            <Input
                                value={formData.bank_agency}
                                onChange={(e) => handleChange('bank_agency', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Conta</label>
                            <Input
                                value={formData.bank_account}
                                onChange={(e) => handleChange('bank_account', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chave PIX</label>
                            <Input
                                value={formData.pix_key}
                                onChange={(e) => handleChange('pix_key', e.target.value)}
                                placeholder="CPF, email ou celular"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {deleting ? 'Excluindo...' : 'Excluir Colaborador'}
                    </Button>

                    <div className="flex gap-3">
                        <Link href={`/colaboradores/${params.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
