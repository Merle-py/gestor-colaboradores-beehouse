'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    User,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Calendar,
    Clock,
    FileText,
    Settings,
    LogOut,
    Bell,
    Shield,
    Edit,
    Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

export default function PerfilPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Mock user data (in production, this would come from auth)
    const [userData, setUserData] = useState({
        full_name: 'Administrador RH',
        email: 'admin@beehouse.com',
        phone: '(11) 99999-9999',
        department: 'RH',
        position: 'Gestor de RH',
        avatar_url: null,
    })

    const [stats, setStats] = useState({
        collaboratorsManaged: 0,
        pendingActions: 0,
        documentsToReview: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            const [collabRes, actionsRes, docsRes] = await Promise.all([
                supabase.from('collaborators').select('id', { count: 'exact', head: true }),
                supabase.from('pending_actions').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
                supabase.from('collaborator_documents').select('id', { count: 'exact', head: true }).eq('status', 'uploaded'),
            ])

            setStats({
                collaboratorsManaged: collabRes.count || 0,
                pendingActions: actionsRes.count || 0,
                documentsToReview: docsRes.count || 0,
            })
            setLoading(false)
        }
        fetchStats()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        // In production: update user profile
        await new Promise(resolve => setTimeout(resolve, 500))
        setFeedback({ message: 'Perfil atualizado com sucesso!', type: 'success' })
        setSaving(false)
        setEditing(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const recentActivities = [
        { action: 'Aprovou recesso de Maria Silva', time: '2 horas atrás', icon: Check },
        { action: 'Cadastrou novo colaborador João Santos', time: '5 horas atrás', icon: User },
        { action: 'Atualizou contrato de Pedro Lima', time: '1 dia atrás', icon: FileText },
    ]

    return (
        <div className="max-w-5xl mx-auto py-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                    <p className="text-gray-500 mt-1">Gerencie suas informações e configurações</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                </Button>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {userData.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{userData.full_name}</CardTitle>
                                    <CardDescription className="text-base">
                                        {userData.position} • {userData.department}
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={editing ? 'default' : 'outline'}
                                onClick={() => editing ? handleSave() : setEditing(true)}
                                disabled={saving}
                            >
                                {editing ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Salvar
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={userData.email}
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900 p-2 bg-gray-50 rounded">{userData.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> Telefone
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={userData.phone}
                                            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900 p-2 bg-gray-50 rounded">{userData.phone}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Departamento
                                    </label>
                                    <p className="text-gray-900 p-2 bg-gray-50 rounded">{userData.department}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Cargo
                                    </label>
                                    <p className="text-gray-900 p-2 bg-gray-50 rounded">{userData.position}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                Atividades Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentActivities.map((activity, i) => {
                                    const Icon = activity.icon
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="p-2 rounded-full bg-primary-50">
                                                <Icon className="w-4 h-4 text-primary-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900">{activity.action}</p>
                                                <p className="text-xs text-gray-500">{activity.time}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-700">Colaboradores</span>
                                <span className="text-2xl font-bold text-blue-900">{stats.collaboratorsManaged}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                                <span className="text-amber-700">Pendências</span>
                                <span className="text-2xl font-bold text-amber-900">{stats.pendingActions}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <span className="text-purple-700">Docs p/ Revisar</span>
                                <span className="text-2xl font-bold text-purple-900">{stats.documentsToReview}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start">
                                <Bell className="w-4 h-4 mr-2" />
                                Notificações
                            </Button>
                            <Button variant="ghost" className="w-full justify-start">
                                <Shield className="w-4 h-4 mr-2" />
                                Segurança
                            </Button>
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                Preferências
                            </Button>
                        </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center text-sm text-gray-500">
                                <p className="font-medium text-gray-700">Beehouse RH v1.0</p>
                                <p className="mt-1">Gestão de Colaboradores</p>
                                <Badge variant="success" className="mt-2">Online</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
