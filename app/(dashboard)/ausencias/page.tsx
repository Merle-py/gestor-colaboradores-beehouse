import { Calendar } from 'lucide-react'

export default function AusenciasPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ausências</h1>
                <p className="text-gray-500 mt-2">Gerencie férias, licenças e afastamentos.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Em Desenvolvimento</h2>
                <p className="text-gray-400 mt-2">Este módulo estará disponível em breve.</p>
            </div>
        </div>
    )
}
