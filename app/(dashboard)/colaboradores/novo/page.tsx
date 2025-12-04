'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, User, Briefcase, Mail, Phone, CreditCard, Building2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
    full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    department: z.string().min(1, 'Selecione um departamento'),
    role: z.string().min(1, 'Cargo é obrigatório'),
    cpf: z.string().optional(),
    phone: z.string().optional(),
})

const departmentsList = [
    'Administrativo',
    'Comercial',
    'Financeiro',
    'Marketing',
    'Operacional',
    'RH',
    'TI',
]

export default function NovoColaboradorPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cpf: '',
        phone: '',
        department: '',
        role: '',
    })

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setFeedback(null)

        try {
            const validated = schema.parse(formData)

            const { error } = await supabase.from('collaborators').insert({
                full_name: validated.full_name,
                email: validated.email,
                status: 'ativo',
                department: validated.department,
            })

            if (error) throw error

            setFeedback({ message: 'Colaborador cadastrado com sucesso!', type: 'success' })
            setTimeout(() => router.push('/colaboradores'), 800)
        } catch (e: any) {
            console.error(e)
            if (e instanceof z.ZodError) {
                setFeedback({ message: e.errors[0].message, type: 'error' })
            } else {
                setFeedback({ message: 'Erro: ' + (e.message || e), type: 'error' })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <Link href="/colaboradores">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Novo Colaborador
                        </h1>
                        <p className="text-lg text-gray-500 mt-1">
                            Preencha a ficha cadastral para admissão.
                        </p>
                    </div>
                </div>
            </div>

            {feedback && (
                <div className="mb-6">
                    <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                        {feedback.message}
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Dados Pessoais */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative">
                    <div className="absolute left-0 top-8 w-1.5 h-12 bg-[#f9b410] rounded-r-full" />
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="w-7 h-7 text-[#f9b410]" />
                        Dados Pessoais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <Input
                                icon={User}
                                value={formData.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                placeholder="Ex: Maria Silva"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <Input
                                icon={Mail}
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="nome@beehouse.com"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">CPF</label>
                            <Input
                                icon={CreditCard}
                                value={formData.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                placeholder="000.000.000-00"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">
                                Telefone
                            </label>
                            <Input
                                icon={Phone}
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="(11) 99999-9999"
                                className="h-12"
                            />
                        </div>
                    </div>
                </div>

                {/* Dados Contratuais */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative overflow-visible z-10">
                    <div className="absolute left-0 top-8 w-1.5 h-12 bg-zinc-800 rounded-r-full" />

                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-gray-700" />
                        Dados Contratuais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">
                                Departamento <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.department}
                                onValueChange={(value) => handleChange('department', value)}
                            >
                                <SelectTrigger className="h-12">
                                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Selecione um departamento..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {departmentsList.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900">
                                Cargo <span className="text-red-500">*</span>
                            </label>
                            <Input
                                icon={Briefcase}
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                placeholder="Ex: Desenvolvedor"
                                className="h-12"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6">
                    <Link href="/colaboradores">
                        <Button variant="ghost" size="lg">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        className="px-10 font-bold text-black shadow-lg shadow-[#f9b410]/30 hover:scale-[1.02] transition-transform"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        Salvar Cadastro
                    </Button>
                </div>
            </form>
        </div>
    )
}
