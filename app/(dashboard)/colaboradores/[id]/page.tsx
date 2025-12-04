'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Building2,
    CreditCard,
    FileText,
    Clock,
    Package,
    RefreshCw,
    MoreHorizontal,
    User,
    DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Collaborator {
    id: string
    full_name: string
    email: string
    phone: string | null
    cpf: string | null
    rg: string | null
    birth_date: string | null
    department: string | null
    position: string | null
    contract_type: string | null
    hire_date: string | null
    status: string
    avatar_url: string | null
    address_street: string | null
    address_city: string | null
    address_state: string | null
    address_zip: string | null
}

interface Contract {
    id: string
    contract_type: string
    start_date: string
    end_date: string | null
    monthly_value: number | null
    status: string
}

interface EPIDelivery {
    id: string
    delivery_date: string
    item: { name: string; category: string }
    quantity: number
}

export default function ColaboradorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [collaborator, setCollaborator] = useState<Collaborator | null>(null)
    const [contracts, setContracts] = useState<Contract[]>([])
    const [deliveries, setDeliveries] = useState<EPIDelivery[]>([])

    const fetchData = async () => {
        if (!params.id) return
        setLoading(true)

        const [collabRes, contractsRes, deliveriesRes] = await Promise.all([
            (supabase.from('collaborators') as any).select('*').eq('id', params.id).single(),
            (supabase.from('contracts') as any).select('*').eq('collaborator_id', params.id).order('start_date', { ascending: false }),
            (supabase.from('epi_deliveries') as any).select('*, item:inventory_items(name, category)').eq('collaborator_id', params.id).order('delivery_date', { ascending: false }).limit(5),
        ])

        if (collabRes.data) setCollaborator(collabRes.data as Collaborator)
        if (contractsRes.data) setContracts(contractsRes.data as Contract[])
        if (deliveriesRes.data) setDeliveries(deliveriesRes.data as unknown as EPIDelivery[])

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [params.id])

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
            ativo: { label: 'Ativo', variant: 'success' },
            inativo: { label: 'Inativo', variant: 'neutral' },
            ferias: { label: 'Férias', variant: 'warning' },
            afastado: { label: 'Afastado', variant: 'warning' },
            desligado: { label: 'Desligado', variant: 'error' },
        }
        const c = config[status] || { label: status, variant: 'neutral' }
        return <Badge variant={c.variant} className="rounded-full font-bold">{c.label}</Badge>
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-48 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!collaborator) {
        return (
            <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Colaborador não encontrado</h2>
                <Link href="/colaboradores">
                    <Button variant="outline" className="mt-4">Voltar</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/colaboradores">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {collaborator.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{collaborator.full_name}</h1>
                            <p className="text-gray-500">{collaborator.position || 'Cargo não definido'} • {collaborator.department || 'Sem departamento'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {getStatusBadge(collaborator.status)}
                    <Link href={`/colaboradores/${params.id}/editar`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Enviar email</DropdownMenuItem>
                            <DropdownMenuItem>Ver documentos</DropdownMenuItem>
                            <DropdownMenuItem>Registrar recesso</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Desligar colaborador</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact & Personal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-500" />
                                Informações Pessoais
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-medium">{collaborator.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Telefone</p>
                                        <p className="font-medium">{collaborator.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">CPF</p>
                                        <p className="font-medium">{collaborator.cpf || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Data de Nascimento</p>
                                        <p className="font-medium">
                                            {collaborator.birth_date ? new Date(collaborator.birth_date).toLocaleDateString('pt-BR') : '-'}
                                        </p>
                                    </div>
                                </div>
                                {collaborator.address_city && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Endereço</p>
                                            <p className="font-medium">
                                                {collaborator.address_street}, {collaborator.address_city} - {collaborator.address_state}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contracts */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-gray-500" />
                                Contratos
                            </CardTitle>
                            <Link href={`/contratos/novo?collaborator=${params.id}`}>
                                <Button variant="outline" size="sm">Novo Contrato</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {contracts.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">Nenhum contrato registrado</p>
                            ) : (
                                <div className="space-y-3">
                                    {contracts.map((contract) => (
                                        <div
                                            key={contract.id}
                                            className={`p-4 rounded-xl border ${contract.status === 'active' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-900">{contract.contract_type}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                                                        {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('pt-BR')}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={contract.status === 'active' ? 'success' : 'neutral'}>
                                                        {contract.status === 'active' ? 'Ativo' : contract.status}
                                                    </Badge>
                                                    {contract.monthly_value && (
                                                        <p className="text-sm font-medium text-gray-700 mt-1">
                                                            R$ {contract.monthly_value.toLocaleString('pt-BR')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Work Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-500" />
                                Dados de Trabalho
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Tipo de Contrato</p>
                                <p className="font-medium">{collaborator.contract_type || '-'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Data de Admissão</p>
                                <p className="font-medium">
                                    {collaborator.hire_date ? new Date(collaborator.hire_date).toLocaleDateString('pt-BR') : '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent EPIs */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="w-5 h-5 text-gray-500" />
                                EPIs Entregues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deliveries.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Nenhuma entrega</p>
                            ) : (
                                <div className="space-y-2">
                                    {deliveries.map((d) => (
                                        <div key={d.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                            <span className="font-medium">{d.item?.name}</span>
                                            <span className="text-gray-500">{new Date(d.delivery_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ações Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={`/documentos?collaborator=${params.id}`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Ver Documentos
                                </Button>
                            </Link>
                            <Link href={`/recessos/novo?collaborator=${params.id}`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Solicitar Recesso
                                </Button>
                            </Link>
                            <Link href={`/materiais/entregas?collaborator=${params.id}`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Package className="w-4 h-4 mr-2" />
                                    Entregar Material
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
