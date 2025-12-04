'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Bell,
    Mail,
    MessageSquare,
    Calendar,
    FileText,
    Shield,
    Package,
    Check,
    Save,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface AlertConfig {
    id: string
    alert_type: string
    name: string
    description: string
    enabled: boolean
    days_before: number
    channels: string[]
}

const defaultAlerts: Omit<AlertConfig, 'id'>[] = [
    {
        alert_type: 'contract_expiration',
        name: 'Vencimento de Contrato PJ',
        description: 'Alerta quando contratos PJ estão próximos do vencimento',
        enabled: true,
        days_before: 30,
        channels: ['email'],
    },
    {
        alert_type: 'ca_expiration',
        name: 'Vencimento de CA de EPI',
        description: 'Alerta quando o Certificado de Aprovação do EPI está vencendo',
        enabled: true,
        days_before: 60,
        channels: ['email'],
    },
    {
        alert_type: 'recess_reminder',
        name: 'Lembrete de Recesso',
        description: 'Notifica sobre recessos programados',
        enabled: true,
        days_before: 7,
        channels: ['email'],
    },
    {
        alert_type: 'document_pending',
        name: 'Documentos Pendentes',
        description: 'Alerta sobre documentos não enviados após admissão',
        enabled: true,
        days_before: 5,
        channels: ['email'],
    },
    {
        alert_type: 'nf_pending',
        name: 'Nota Fiscal Pendente',
        description: 'Alerta sobre NFs não recebidas de prestadores PJ',
        enabled: true,
        days_before: 5,
        channels: ['email'],
    },
]

export default function AlertasPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alerts, setAlerts] = useState<AlertConfig[]>([])
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [emailRecipients, setEmailRecipients] = useState('')

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        const { data } = await supabase
            .from('alert_configurations')
            .select('*')
            .order('created_at')

        if (data && data.length > 0) {
            setAlerts(data as AlertConfig[])
        } else {
            // Use defaults if no configs exist
            setAlerts(defaultAlerts.map((a, i) => ({ ...a, id: `temp-${i}` })))
        }
        setLoading(false)
    }

    const handleToggle = (id: string) => {
        setAlerts(alerts.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        ))
    }

    const handleDaysChange = (id: string, days: number) => {
        setAlerts(alerts.map((a) =>
            a.id === id ? { ...a, days_before: days } : a
        ))
    }

    const handleChannelToggle = (id: string, channel: string) => {
        setAlerts(alerts.map((a) => {
            if (a.id !== id) return a
            const channels = a.channels.includes(channel)
                ? a.channels.filter((c) => c !== channel)
                : [...a.channels, channel]
            return { ...a, channels }
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        setFeedback(null)

        try {
            // Upsert all configurations
            for (const alert of alerts) {
                if (alert.id.startsWith('temp-')) {
                    await supabase.from('alert_configurations').insert({
                        alert_type: alert.alert_type,
                        name: alert.name,
                        description: alert.description,
                        enabled: alert.enabled,
                        days_before: alert.days_before,
                        channels: alert.channels,
                    })
                } else {
                    await supabase
                        .from('alert_configurations')
                        .update({
                            enabled: alert.enabled,
                            days_before: alert.days_before,
                            channels: alert.channels,
                        })
                        .eq('id', alert.id)
                }
            }

            setFeedback({ message: 'Configurações salvas com sucesso!', type: 'success' })
            fetchAlerts()
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'contract_expiration': return FileText
            case 'ca_expiration': return Shield
            case 'recess_reminder': return Calendar
            case 'document_pending': return FileText
            case 'nf_pending': return FileText
            default: return Bell
        }
    }

    const enabledCount = alerts.filter((a) => a.enabled).length

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Alertas e Notificações</h1>
                        <p className="text-gray-500">Configure alertas automáticos do sistema</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar
                </Button>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <Bell className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
                            <p className="text-xs text-gray-500">Alertas Ativos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                            <Bell className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-500">{alerts.length - enabledCount}</p>
                            <p className="text-xs text-gray-500">Desativados</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Email Recipients */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary-500" />
                        Destinatários de Email
                    </CardTitle>
                    <CardDescription>
                        Emails que receberão os alertas (separados por vírgula)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        placeholder="rh@empresa.com, diretor@empresa.com"
                    />
                </CardContent>
            </Card>

            {/* Alert List */}
            {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => {
                        const Icon = getAlertIcon(alert.alert_type)

                        return (
                            <Card key={alert.id} className={alert.enabled ? '' : 'opacity-60'}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${alert.enabled ? 'bg-primary-50' : 'bg-gray-100'}`}>
                                            <Icon className={`w-5 h-5 ${alert.enabled ? 'text-primary-600' : 'text-gray-400'}`} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{alert.name}</h3>
                                                <Badge variant={alert.enabled ? 'success' : 'neutral'}>
                                                    {alert.enabled ? 'Ativo' : 'Desativado'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">{alert.description}</p>

                                            <div className="flex flex-wrap items-center gap-4">
                                                {/* Toggle */}
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={alert.enabled}
                                                        onChange={() => handleToggle(alert.id)}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                    <span className="text-sm">Ativar</span>
                                                </label>

                                                {/* Days before */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Alertar</span>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="90"
                                                        value={alert.days_before}
                                                        onChange={(e) => handleDaysChange(alert.id, parseInt(e.target.value) || 1)}
                                                        className="w-16 text-center"
                                                    />
                                                    <span className="text-sm text-gray-600">dias antes</span>
                                                </div>

                                                {/* Channels */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Via:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChannelToggle(alert.id, 'email')}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${alert.channels.includes('email')
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                    >
                                                        <Mail className="w-3 h-3" />
                                                        Email
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChannelToggle(alert.id, 'sms')}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${alert.channels.includes('sms')
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                        SMS
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-800">
                        <strong>📧 Como funcionam os alertas:</strong> O sistema verifica diariamente os prazos e envia notificações
                        automáticas conforme configurado. Para receber emails, configure um serviço SMTP nas variáveis de ambiente.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
