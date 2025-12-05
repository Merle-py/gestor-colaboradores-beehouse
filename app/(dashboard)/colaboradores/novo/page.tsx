'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Check,
    User,
    Briefcase,
    Mail,
    Phone,
    CreditCard,
    Building2,
    MapPin,
    Calendar,
    DollarSign,
    ChevronRight,
    FileText,
    Loader2
} from 'lucide-react'
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
import type { ContractType } from '@/types/database.types'

const schema = z.object({
    full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    department: z.string().min(1, 'Selecione um departamento'),
    position: z.string().min(1, 'Cargo é obrigatório'),
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
    'Jurídico',
    'Engenharia',
]

type Step = 'personal' | 'contract' | 'documents'

export default function NovoColaboradorPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState<Step>('personal')
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const isSubmitting = useRef(false) // Prevent double submission

    // Personal Data
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cpf: '',
        rg: '',
        phone: '',
        birth_date: '',
        department: '',
        position: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        // Bank data
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'corrente',
        pix_key: '',
    })

    // Contract Data
    const [contractData, setContractData] = useState({
        create_contract: true,
        contract_type: 'CLT' as ContractType,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_value: '',
        payment_day: '5',
        work_hours_per_week: '40',
    })

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleContractChange = (field: string, value: string | boolean) => {
        setContractData((prev) => ({ ...prev, [field]: value }))
    }

    const nextStep = () => {
        if (currentStep === 'personal') {
            // Validate personal data
            try {
                schema.parse(formData)
                setCurrentStep('contract')
                setFeedback(null)
            } catch (e: any) {
                if (e instanceof z.ZodError) {
                    setFeedback({ message: e.errors[0].message, type: 'error' })
                }
            }
        } else if (currentStep === 'contract') {
            setCurrentStep('documents')
            setFeedback(null)
        }
    }

    const prevStep = () => {
        if (currentStep === 'contract') setCurrentStep('personal')
        else if (currentStep === 'documents') setCurrentStep('contract')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prevent double submission using both ref and state
        if (isSubmitting.current || loading) return
        isSubmitting.current = true

        setLoading(true)
        setFeedback(null)

        try {
            // Get token from localStorage
            const token = localStorage.getItem('auth_token')

            // Use API route instead of direct Supabase (bypasses RLS)
            const response = await fetch('/api/collaborators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    contract_type: contractData.contract_type,
                    hire_date: contractData.start_date,
                    create_contract: contractData.create_contract,
                    start_date: contractData.start_date,
                    end_date: contractData.end_date,
                    monthly_value: contractData.monthly_value,
                    payment_day: contractData.payment_day,
                    work_hours_per_week: contractData.work_hours_per_week,
                }),
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error)
            }

            setFeedback({ message: 'Colaborador cadastrado com sucesso!', type: 'success' })
            setTimeout(() => router.push('/colaboradores'), 1000)
        } catch (e: any) {
            console.error(e)
            setFeedback({ message: 'Erro: ' + (e.message || e), type: 'error' })
            isSubmitting.current = false // Reset on error to allow retry
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { id: 'personal', label: 'Dados Pessoais', icon: User },
        { id: 'contract', label: 'Contrato', icon: Briefcase },
        { id: 'documents', label: 'Finalizar', icon: FileText },
    ]

    return (
        <div className="max-w-4xl mx-auto py-8 px-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/colaboradores">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nova Admissão</h1>
                    <p className="text-gray-500">Cadastro completo com contrato</p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-10">
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isActive = step.id === currentStep
                    const isCompleted =
                        (currentStep === 'contract' && step.id === 'personal') ||
                        (currentStep === 'documents' && (step.id === 'personal' || step.id === 'contract'))

                    return (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive
                                    ? 'bg-primary-500 text-black font-bold shadow-lg'
                                    : isCompleted
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                                <span className="text-sm hidden sm:inline">{step.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <ChevronRight className="w-5 h-5 mx-2 text-gray-300" />
                            )}
                        </div>
                    )
                })}
            </div>

            {feedback && (
                <div className="mb-6">
                    <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                        {feedback.message}
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Data */}
                {currentStep === 'personal' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                            <User className="w-6 h-6 text-primary-500" />
                            Dados Pessoais
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">
                                    Nome Completo <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    icon={User}
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    placeholder="Ex: Maria Silva"
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
                                    placeholder="email@beehouse.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">CPF</label>
                                <Input
                                    icon={CreditCard}
                                    value={formData.cpf}
                                    onChange={(e) => handleChange('cpf', e.target.value)}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">RG</label>
                                <Input
                                    value={formData.rg}
                                    onChange={(e) => handleChange('rg', e.target.value)}
                                    placeholder="00.000.000-0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Telefone</label>
                                <Input
                                    icon={Phone}
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Data de Nascimento</label>
                                <Input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => handleChange('birth_date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">
                                    Departamento <span className="text-red-500">*</span>
                                </label>
                                <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
                                    <SelectTrigger>
                                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentsList.map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                                    value={formData.position}
                                    onChange={(e) => handleChange('position', e.target.value)}
                                    placeholder="Ex: Desenvolvedor"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                Endereço
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Rua</label>
                                    <Input
                                        value={formData.address_street}
                                        onChange={(e) => handleChange('address_street', e.target.value)}
                                        placeholder="Rua, número, complemento"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                                    <Input
                                        value={formData.address_city}
                                        onChange={(e) => handleChange('address_city', e.target.value)}
                                        placeholder="Cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <Input
                                        value={formData.address_state}
                                        onChange={(e) => handleChange('address_state', e.target.value)}
                                        placeholder="UF"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bank Data */}
                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-500" />
                                Dados Bancários
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Banco</label>
                                    <Input
                                        value={formData.bank_name}
                                        onChange={(e) => handleChange('bank_name', e.target.value)}
                                        placeholder="Nome do banco"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Agência</label>
                                    <Input
                                        value={formData.bank_agency}
                                        onChange={(e) => handleChange('bank_agency', e.target.value)}
                                        placeholder="0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Conta</label>
                                    <Input
                                        value={formData.bank_account}
                                        onChange={(e) => handleChange('bank_account', e.target.value)}
                                        placeholder="00000-0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                                    <Select value={formData.bank_account_type} onValueChange={(v) => handleChange('bank_account_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="corrente">Conta Corrente</SelectItem>
                                            <SelectItem value="poupanca">Poupança</SelectItem>
                                            <SelectItem value="salario">Conta Salário</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                                    <Input
                                        value={formData.pix_key}
                                        onChange={(e) => handleChange('pix_key', e.target.value)}
                                        placeholder="CPF, email, telefone ou chave aleatória"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Contract */}
                {currentStep === 'contract' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                            <Briefcase className="w-6 h-6 text-primary-500" />
                            Dados do Contrato
                        </h3>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <input
                                type="checkbox"
                                id="create_contract"
                                checked={contractData.create_contract}
                                onChange={(e) => handleContractChange('create_contract', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300"
                            />
                            <label htmlFor="create_contract" className="font-medium text-gray-800">
                                Criar contrato automaticamente para este colaborador
                            </label>
                        </div>

                        {contractData.create_contract && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-900">Tipo de Contrato</label>
                                    <Select
                                        value={contractData.contract_type}
                                        onValueChange={(v) => handleContractChange('contract_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
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
                                    <label className="block text-sm font-bold text-gray-900">Data de Início</label>
                                    <Input
                                        type="date"
                                        value={contractData.start_date}
                                        onChange={(e) => handleContractChange('start_date', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-900">Data de Término</label>
                                    <Input
                                        type="date"
                                        value={contractData.end_date}
                                        onChange={(e) => handleContractChange('end_date', e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">Deixe vazio para contrato indeterminado</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-900">Valor Mensal (R$)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={contractData.monthly_value}
                                        onChange={(e) => handleContractChange('monthly_value', e.target.value)}
                                        placeholder="0,00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-900">Dia do Pagamento</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={contractData.payment_day}
                                        onChange={(e) => handleContractChange('payment_day', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-900">Horas Semanais</label>
                                    <Input
                                        type="number"
                                        value={contractData.work_hours_per_week}
                                        onChange={(e) => handleContractChange('work_hours_per_week', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Review & Finalize */}
                {currentStep === 'documents' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                            <FileText className="w-6 h-6 text-primary-500" />
                            Resumo da Admissão
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Colaborador
                                </h4>
                                <p className="text-gray-900 font-medium">{formData.full_name}</p>
                                <p className="text-sm text-gray-600">{formData.email}</p>
                                <p className="text-sm text-gray-600">{formData.department} - {formData.position}</p>
                            </div>

                            {contractData.create_contract && (
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Contrato
                                    </h4>
                                    <p className="text-blue-900 font-medium">{contractData.contract_type}</p>
                                    <p className="text-sm text-blue-700">Início: {new Date(contractData.start_date).toLocaleDateString('pt-BR')}</p>
                                    {contractData.monthly_value && (
                                        <p className="text-sm text-blue-700">Valor: R$ {parseFloat(contractData.monthly_value).toLocaleString('pt-BR')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h4 className="font-bold text-amber-800 mb-2">📋 Próximos Passos</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                                <li>• Upload de documentos será solicitado após o cadastro</li>
                                <li>• Assinatura de termos pendente</li>
                                <li>• Entrega de EPIs/materiais</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                    <div>
                        {currentStep !== 'personal' && (
                            <Button type="button" variant="ghost" onClick={prevStep}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Link href="/colaboradores">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>

                        {currentStep !== 'documents' ? (
                            <Button type="button" onClick={nextStep}>
                                Próximo
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Finalizar Admissão
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
