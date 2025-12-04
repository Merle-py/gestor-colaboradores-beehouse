'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    Users,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Loader2,
    Package,
    DollarSign,
    PieChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface DepartmentCost {
    department: string
    pjTotal: number
    cltTotal: number
    materialsTotal: number
    headcount: number
}

interface ContractTypeCost {
    type: string
    total: number
    count: number
    percentage: number
}

export default function CustosPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('current')
    const [departmentCosts, setDepartmentCosts] = useState<DepartmentCost[]>([])
    const [contractTypeCosts, setContractTypeCosts] = useState<ContractTypeCost[]>([])
    const [totalCost, setTotalCost] = useState(0)

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)

        // Fetch contracts with collaborators
        const { data: contracts } = await (supabase.from('contracts') as any)
            .select('*, collaborator:collaborators(full_name, department)')
            .eq('status', 'active')

        if (contracts) {
            // Group by department
            const deptMap: Record<string, DepartmentCost> = {}

            contracts.forEach((c: any) => {
                const dept = c.collaborator?.department || 'Sem Departamento'
                if (!deptMap[dept]) {
                    deptMap[dept] = {
                        department: dept,
                        pjTotal: 0,
                        cltTotal: 0,
                        materialsTotal: 0,
                        headcount: 0,
                    }
                }

                deptMap[dept].headcount++
                if (c.contract_type === 'PJ') {
                    deptMap[dept].pjTotal += c.monthly_value || 0
                } else if (c.contract_type === 'CLT') {
                    deptMap[dept].cltTotal += c.monthly_value || 0
                }
            })

            setDepartmentCosts(Object.values(deptMap).sort((a, b) =>
                (b.pjTotal + b.cltTotal) - (a.pjTotal + a.cltTotal)
            ))

            // Contract type distribution
            const typeMap: Record<string, { total: number; count: number }> = {}
            let total = 0

            contracts.forEach((c: any) => {
                const type = c.contract_type || 'Outro'
                if (!typeMap[type]) {
                    typeMap[type] = { total: 0, count: 0 }
                }
                typeMap[type].total += c.monthly_value || 0
                typeMap[type].count++
                total += c.monthly_value || 0
            })

            setTotalCost(total)

            const typeCosts: ContractTypeCost[] = Object.entries(typeMap).map(([type, data]) => ({
                type,
                total: data.total,
                count: data.count,
                percentage: total > 0 ? (data.total / total) * 100 : 0,
            }))

            setContractTypeCosts(typeCosts.sort((a, b) => b.total - a.total))
        }

        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'PJ': 'bg-green-500',
            'CLT': 'bg-blue-500',
            'Estagiário': 'bg-purple-500',
            'Temporário': 'bg-amber-500',
        }
        return colors[type] || 'bg-gray-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/financeiro">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Análise de Custos</h1>
                    <p className="text-gray-500 text-sm">Visualização detalhada de custos por área e tipo</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="current">Mês Atual</SelectItem>
                        <SelectItem value="last3">Últimos 3 meses</SelectItem>
                        <SelectItem value="last6">Últimos 6 meses</SelectItem>
                        <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Total Card */}
            <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm font-medium">Custo Total Mensal</p>
                            <p className="text-4xl font-extrabold mt-1">{formatCurrency(totalCost)}</p>
                            <p className="text-primary-200 text-sm mt-2">
                                {departmentCosts.reduce((sum, d) => sum + d.headcount, 0)} colaboradores ativos
                            </p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-2xl">
                            <DollarSign className="w-10 h-10" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contract Types Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-gray-500" />
                            Distribuição por Tipo de Contrato
                        </CardTitle>
                        <CardDescription>Custos mensais por modalidade</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {contractTypeCosts.map((ct) => (
                                <div key={ct.type} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getTypeColor(ct.type)}`} />
                                            <span className="font-medium text-gray-900">{ct.type}</span>
                                            <span className="text-sm text-gray-500">({ct.count} pessoas)</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{formatCurrency(ct.total)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${getTypeColor(ct.type)}`}
                                            style={{ width: `${ct.percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 text-right">{ct.percentage.toFixed(1)}% do total</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Average Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            Métricas de Custo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 rounded-lg">
                                        <Users className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Custo Médio por Colaborador</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatCurrency(totalCost / Math.max(departmentCosts.reduce((sum, d) => sum + d.headcount, 0), 1))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Briefcase className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700">Custo Médio PJ</p>
                                        <p className="text-xl font-bold text-green-800">
                                            {formatCurrency(
                                                contractTypeCosts.find(c => c.type === 'PJ')?.total || 0 /
                                                Math.max(contractTypeCosts.find(c => c.type === 'PJ')?.count || 1, 1)
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-700">Custo Médio CLT</p>
                                        <p className="text-xl font-bold text-blue-800">
                                            {formatCurrency(
                                                contractTypeCosts.find(c => c.type === 'CLT')?.total || 0 /
                                                Math.max(contractTypeCosts.find(c => c.type === 'CLT')?.count || 1, 1)
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Costs by Department */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        Custos por Departamento
                    </CardTitle>
                    <CardDescription>Distribuição de custos por área</CardDescription>
                </CardHeader>
                <CardContent>
                    {departmentCosts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum departamento encontrado</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {departmentCosts.map((dept, index) => {
                                const deptTotal = dept.pjTotal + dept.cltTotal
                                const maxTotal = Math.max(...departmentCosts.map(d => d.pjTotal + d.cltTotal))
                                const widthPercentage = (deptTotal / maxTotal) * 100

                                return (
                                    <div key={dept.department} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{dept.department}</p>
                                                    <p className="text-xs text-gray-500">{dept.headcount} colaboradores</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatCurrency(deptTotal)}</p>
                                                <div className="flex gap-2 text-xs">
                                                    {dept.pjTotal > 0 && (
                                                        <span className="text-green-600">PJ: {formatCurrency(dept.pjTotal)}</span>
                                                    )}
                                                    {dept.cltTotal > 0 && (
                                                        <span className="text-blue-600">CLT: {formatCurrency(dept.cltTotal)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
                                            {dept.pjTotal > 0 && (
                                                <div
                                                    className="bg-green-500 h-3"
                                                    style={{ width: `${(dept.pjTotal / deptTotal) * widthPercentage}%` }}
                                                />
                                            )}
                                            {dept.cltTotal > 0 && (
                                                <div
                                                    className="bg-blue-500 h-3"
                                                    style={{ width: `${(dept.cltTotal / deptTotal) * widthPercentage}%` }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
