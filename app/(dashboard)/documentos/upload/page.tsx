'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Upload,
    FileText,
    Check,
    X,
    Eye,
    Trash2,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface DocumentUpload {
    id: string
    checklist_id: string
    document_name: string
    status: 'pending' | 'uploaded' | 'approved' | 'rejected'
    file_url: string | null
    uploaded_at: string | null
    notes: string | null
}

interface Collaborator {
    id: string
    full_name: string
}

interface ChecklistItem {
    id: string
    document_name: string
    is_required: boolean
    category: string
}

export default function UploadDocumentosPage() {
    const searchParams = useSearchParams()
    const collaboratorId = searchParams.get('collaborator')
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState<string | null>(null)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [selectedCollaborator, setSelectedCollaborator] = useState(collaboratorId || '')
    const [checklist, setChecklist] = useState<ChecklistItem[]>([])
    const [documents, setDocuments] = useState<DocumentUpload[]>([])
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

    useEffect(() => {
        fetchCollaborators()
        fetchChecklist()
    }, [])

    useEffect(() => {
        if (selectedCollaborator) {
            fetchDocuments()
        }
    }, [selectedCollaborator])

    const fetchCollaborators = async () => {
        const { data } = await supabase
            .from('collaborators')
            .select('id, full_name')
            .order('full_name')
        if (data) setCollaborators(data)
    }

    const fetchChecklist = async () => {
        const { data } = await supabase
            .from('document_checklists')
            .select('*')
            .order('display_order')
        if (data) setChecklist(data as ChecklistItem[])
    }

    const fetchDocuments = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('collaborator_documents')
            .select('*')
            .eq('collaborator_id', selectedCollaborator)

        if (data) {
            // Map documents to checklist items
            const docMap = new Map(data.map((d: any) => [d.checklist_item_id, d]))
            const mapped = checklist.map((item) => {
                const doc = docMap.get(item.id)
                return {
                    id: doc?.id || `pending-${item.id}`,
                    checklist_id: item.id,
                    document_name: item.document_name,
                    status: doc?.status || 'pending',
                    file_url: doc?.file_url || null,
                    uploaded_at: doc?.uploaded_at || null,
                    notes: doc?.notes || null,
                }
            })
            setDocuments(mapped as DocumentUpload[])
        }
        setLoading(false)
    }

    const handleFileSelect = (checklistId: string) => {
        setCurrentUploadId(checklistId)
        fileInputRef.current?.click()
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUploadId || !selectedCollaborator) return

        setUploading(currentUploadId)
        setFeedback(null)

        try {
            // Upload to Supabase Storage
            const fileName = `${selectedCollaborator}/${currentUploadId}/${Date.now()}_${file.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName)

            // Check if record exists
            const { data: existing } = await (supabase.from('collaborator_documents') as any)
                .select('id')
                .eq('collaborator_id', selectedCollaborator)
                .eq('checklist_item_id', currentUploadId)
                .single()

            if (existing) {
                // Update existing
                await (supabase.from('collaborator_documents') as any)
                    .update({
                        file_url: publicUrl,
                        status: 'uploaded',
                        uploaded_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
            } else {
                // Create new
                await (supabase.from('collaborator_documents') as any).insert({
                    collaborator_id: selectedCollaborator,
                    checklist_item_id: currentUploadId,
                    file_url: publicUrl,
                    status: 'uploaded',
                    uploaded_at: new Date().toISOString(),
                })
            }

            setFeedback({ message: 'Documento enviado com sucesso!', type: 'success' })
            fetchDocuments()
        } catch (error: any) {
            console.error('Upload error:', error)
            setFeedback({ message: 'Erro no upload: ' + error.message, type: 'error' })
        } finally {
            setUploading(null)
            setCurrentUploadId(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleApprove = async (docId: string) => {
        if (docId.startsWith('pending-')) return
        await (supabase.from('collaborator_documents') as any)
            .update({ status: 'approved' })
            .eq('id', docId)
        fetchDocuments()
    }

    const handleReject = async (docId: string) => {
        if (docId.startsWith('pending-')) return
        const notes = prompt('Motivo da rejeição:')
        if (notes === null) return
        await (supabase.from('collaborator_documents') as any)
            .update({ status: 'rejected', notes })
            .eq('id', docId)
        fetchDocuments()
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral'; icon: any }> = {
            pending: { label: 'Pendente', variant: 'warning', icon: Clock },
            uploaded: { label: 'Enviado', variant: 'neutral', icon: Upload },
            approved: { label: 'Aprovado', variant: 'success', icon: CheckCircle },
            rejected: { label: 'Rejeitado', variant: 'error', icon: AlertCircle },
        }
        const c = config[status] || config.pending
        const Icon = c.icon
        return (
            <Badge variant={c.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {c.label}
            </Badge>
        )
    }

    // Stats
    const pendingCount = documents.filter((d) => d.status === 'pending').length
    const uploadedCount = documents.filter((d) => d.status === 'uploaded').length
    const approvedCount = documents.filter((d) => d.status === 'approved').length
    const rejectedCount = documents.filter((d) => d.status === 'rejected').length

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/documentos">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upload de Documentos</h1>
                    <p className="text-gray-500">Envie e gerencie documentos do colaborador</p>
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
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                            <p className="text-xs text-amber-600">Pendentes</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">{uploadedCount}</p>
                            <p className="text-xs text-blue-600">Enviados</p>
                        </div>
                        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
                            <p className="text-xs text-green-600">Aprovados</p>
                        </div>
                        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
                            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
                            <p className="text-xs text-red-600">Rejeitados</p>
                        </div>
                    </div>

                    {/* Documents List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Documentos
                            </CardTitle>
                            <CardDescription>
                                Clique em "Enviar" para fazer upload de cada documento
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${doc.status === 'approved'
                                                ? 'bg-green-50 border-green-200'
                                                : doc.status === 'rejected'
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className={`w-5 h-5 ${doc.status === 'approved' ? 'text-green-500' :
                                                    doc.status === 'rejected' ? 'text-red-500' :
                                                        'text-gray-400'
                                                    }`} />
                                                <div>
                                                    <p className="font-medium text-gray-900">{doc.document_name}</p>
                                                    {doc.uploaded_at && (
                                                        <p className="text-xs text-gray-500">
                                                            Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    )}
                                                    {doc.notes && doc.status === 'rejected' && (
                                                        <p className="text-xs text-red-600 mt-1">⚠️ {doc.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(doc.status)}

                                                {doc.status === 'pending' || doc.status === 'rejected' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleFileSelect(doc.checklist_id)}
                                                        disabled={uploading === doc.checklist_id}
                                                    >
                                                        {uploading === doc.checklist_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4 mr-1" />
                                                                Enviar
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <>
                                                        {doc.file_url && (
                                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" variant="ghost">
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </a>
                                                        )}
                                                        {doc.status === 'uploaded' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-green-600 hover:bg-green-50"
                                                                    onClick={() => handleApprove(doc.id)}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleReject(doc.id)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Google Drive Link */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ExternalLink className="w-5 h-5" />
                                Pasta na Nuvem
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-3">
                                Configure um link externo para a pasta do colaborador no Google Drive ou outro serviço.
                            </p>
                            <div className="flex gap-2">
                                <Input placeholder="https://drive.google.com/..." />
                                <Button variant="outline">Salvar Link</Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
