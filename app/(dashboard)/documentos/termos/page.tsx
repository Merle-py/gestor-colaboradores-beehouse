'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    FileSignature,
    Check,
    Clock,
    Send,
    Eye,
    Loader2,
    FileText,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface Term {
    id: string
    term_type: string
    term_title: string
    term_content: string
    is_required: boolean
}

interface SignedTerm {
    id: string
    term_id: string
    collaborator_id: string
    signed_at: string | null
    ip_address: string | null
}

interface Collaborator {
    id: string
    full_name: string
}

const termTypes = [
    { value: 'contract', label: 'Contrato de Prestação de Serviços' },
    { value: 'confidentiality', label: 'Termo de Confidencialidade' },
    { value: 'responsibility', label: 'Termo de Responsabilidade' },
    { value: 'equipment', label: 'Termo de Guarda de Equipamentos' },
    { value: 'image', label: 'Termo de Uso de Imagem' },
    { value: 'lgpd', label: 'Termo LGPD' },
]

export default function TermosPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [selectedCollaborator, setSelectedCollaborator] = useState('')
    const [terms, setTerms] = useState<Term[]>([])
    const [signedTerms, setSignedTerms] = useState<SignedTerm[]>([])
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        fetchCollaborators()
        fetchTerms()
    }, [])

    useEffect(() => {
        if (selectedCollaborator) {
            fetchSignedTerms()
        }
    }, [selectedCollaborator])

    const fetchCollaborators = async () => {
        const { data } = await supabase.from('collaborators').select('id, full_name').order('full_name')
        if (data) setCollaborators(data)
    }

    const fetchTerms = async () => {
        const { data } = await supabase.from('signature_terms').select('*').eq('is_active', true)
        if (data) setTerms(data as Term[])
        setLoading(false)
    }

    const fetchSignedTerms = async () => {
        const { data } = await supabase
            .from('collaborator_terms')
            .select('*')
            .eq('collaborator_id', selectedCollaborator)
        if (data) setSignedTerms(data as SignedTerm[])
    }

    const isTermSigned = (termId: string) => {
        return signedTerms.some((st) => st.term_id === termId && st.signed_at)
    }

    const handleSendForSignature = async (termId: string) => {
        if (!selectedCollaborator) return
        setSending(true)

        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('collaborator_terms')
                .select('id')
                .eq('collaborator_id', selectedCollaborator)
                .eq('term_id', termId)
                .single()

            if (!existing) {
                await (supabase.from('collaborator_terms') as any).insert({
                    collaborator_id: selectedCollaborator,
                    term_id: termId,
                    sent_at: new Date().toISOString(),
                })
            }

            // Create pending action
            await (supabase.from('pending_actions') as any).insert({
                action_type: 'signature_required',
                title: `Assinatura pendente: ${terms.find((t) => t.id === termId)?.term_title}`,
                collaborator_id: selectedCollaborator,
                status: 'pending',
                priority: 8,
                module: 'Documentos',
            })

            setFeedback({ message: 'Termo enviado para assinatura!', type: 'success' })
            fetchSignedTerms()
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        } finally {
            setSending(false)
        }
    }

    const handleSimulateSignature = async (termId: string) => {
        if (!selectedCollaborator) return

        try {
            await (supabase.from('collaborator_terms') as any)
                .update({
                    signed_at: new Date().toISOString(),
                    ip_address: '127.0.0.1',
                })
                .eq('collaborator_id', selectedCollaborator)
                .eq('term_id', termId)

            setFeedback({ message: 'Termo assinado com sucesso!', type: 'success' })
            fetchSignedTerms()
        } catch (error: any) {
            setFeedback({ message: 'Erro: ' + error.message, type: 'error' })
        }
    }

    const pendingCount = terms.filter((t) => !isTermSigned(t.id)).length
    const signedCount = terms.filter((t) => isTermSigned(t.id)).length

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/documentos">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assinatura de Termos</h1>
                    <p className="text-gray-500">Gerencie termos e contratos para assinatura eletrônica</p>
                </div>
            </div>

            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'success'}>
                    {feedback.message}
                </Alert>
            )}

            {/* Collaborator Select */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione o Colaborador</label>
                        <Select value={selectedCollaborator} onValueChange={setSelectedCollaborator}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolha um colaborador..." />
                            </SelectTrigger>
                            <SelectContent>
                                {collaborators.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedCollaborator && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                            <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
                            <p className="text-xs text-amber-600">Pendentes de Assinatura</p>
                        </div>
                        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                            <p className="text-3xl font-bold text-green-700">{signedCount}</p>
                            <p className="text-xs text-green-600">Assinados</p>
                        </div>
                    </div>

                    {/* Terms List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSignature className="w-5 h-5" />
                                Termos Disponíveis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                                </div>
                            ) : terms.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>Nenhum termo cadastrado</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {terms.map((term) => {
                                        const signed = isTermSigned(term.id)
                                        const signedData = signedTerms.find((st) => st.term_id === term.id)

                                        return (
                                            <div
                                                key={term.id}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {signed ? (
                                                        <Check className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <Clock className="w-5 h-5 text-amber-500" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{term.term_title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {termTypes.find((t) => t.value === term.term_type)?.label}
                                                            {term.is_required && (
                                                                <span className="ml-2 text-red-500">• Obrigatório</span>
                                                            )}
                                                        </p>
                                                        {signed && signedData?.signed_at && (
                                                            <p className="text-xs text-green-600 mt-1">
                                                                ✓ Assinado em {new Date(signedData.signed_at).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {signed ? (
                                                        <Badge variant="success">Assinado</Badge>
                                                    ) : signedData ? (
                                                        <>
                                                            <Badge variant="warning">Aguardando</Badge>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSimulateSignature(term.id)}
                                                            >
                                                                <FileSignature className="w-4 h-4 mr-1" />
                                                                Assinar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSendForSignature(term.id)}
                                                            disabled={sending}
                                                        >
                                                            {sending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4 mr-1" />
                                                                    Enviar
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Term Modal could be added here */}
                </>
            )}
        </div>
    )
}
