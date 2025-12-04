'use client'

import { Construction, Banknote, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function FinanceiroPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financeiro</h1>
                <p className="text-gray-500 mt-2">Gestão financeira de contratos e pagamentos.</p>
            </div>

            {/* Quick Stats Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-50">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">R$ 0,00</p>
                                <p className="text-xs text-gray-500">Total Contratos PJ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-50">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">R$ 0,00</p>
                                <p className="text-xs text-gray-500">Folha CLT</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-50">
                                <TrendingDown className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">R$ 0,00</p>
                                <p className="text-xs text-gray-500">Custo Materiais</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coming Soon */}
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Construction className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-700">Módulo em Desenvolvimento</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    O módulo financeiro está sendo desenvolvido. Em breve você poderá:
                </p>
                <ul className="text-sm text-gray-600 mt-4 space-y-2">
                    <li>• Controlar pagamentos de contratos PJ</li>
                    <li>• Visualizar custo total de folha CLT</li>
                    <li>• Acompanhar gastos com materiais e EPIs</li>
                    <li>• Gerar relatórios de custos por departamento</li>
                </ul>
            </div>
        </div>
    )
}
