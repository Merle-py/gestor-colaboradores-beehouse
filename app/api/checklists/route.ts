import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET all document checklists
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const { searchParams } = new URL(request.url)
        const collaboratorId = searchParams.get('collaborator_id')

        let query = (supabase as any)
            .from('document_checklists')
            .select('*, collaborators(full_name)')
            .order('created_at', { ascending: false })

        if (collaboratorId) {
            query = query.eq('collaborator_id', collaboratorId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching checklists:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create or update document checklist
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('document_checklists')
            .upsert({
                collaborator_id: body.collaborator_id,
                document_type: body.document_type,
                is_required: body.is_required ?? true,
                is_submitted: body.is_submitted ?? false,
                submitted_at: body.is_submitted ? new Date().toISOString() : null,
                notes: body.notes || null,
            }, { onConflict: 'collaborator_id,document_type' })
            .select()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error saving checklist:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
