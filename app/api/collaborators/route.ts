import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateAuth, unauthorizedResponse } from '@/lib/auth/validate'

// GET all collaborators
export async function GET(request: NextRequest) {
    // Validate authentication
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('collaborators')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching collaborators:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new collaborator
export async function POST(request: NextRequest) {
    // Validate authentication
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        // Insert collaborator with bank data
        const { data: collab, error: collabError } = await (supabase as any)
            .from('collaborators')
            .insert({
                full_name: body.full_name,
                email: body.email,
                cpf: body.cpf || null,
                rg: body.rg || null,
                phone: body.phone || null,
                birth_date: body.birth_date || null,
                department: body.department,
                position: body.position,
                contract_type: body.contract_type || 'CLT',
                hire_date: body.hire_date || null,
                address_street: body.address_street || null,
                address_city: body.address_city || null,
                address_state: body.address_state || null,
                address_zip: body.address_zip || null,
                // Bank data
                bank_name: body.bank_name || null,
                bank_agency: body.bank_agency || null,
                bank_account: body.bank_account || null,
                bank_account_type: body.bank_account_type || null,
                pix_key: body.pix_key || null,
                status: body.status || 'ativo',
            })
            .select()
            .single()

        if (collabError) throw collabError

        // Create contract if requested
        if (body.create_contract && collab) {
            const { error: contractError } = await (supabase as any)
                .from('contracts')
                .insert({
                    collaborator_id: collab.id,
                    contract_type: body.contract_type || 'CLT',
                    start_date: body.start_date,
                    end_date: body.end_date || null,
                    monthly_value: body.monthly_value ? parseFloat(body.monthly_value) : null,
                    payment_day: parseInt(body.payment_day) || 5,
                    work_hours_per_week: parseInt(body.work_hours_per_week) || 40,
                    status: 'active',
                })

            if (contractError) {
                console.error('Contract error:', contractError)
            }
        }

        // Create pending action for documents
        if (collab) {
            await (supabase as any).from('pending_actions').insert({
                action_type: 'document_upload',
                title: `Documentos pendentes: ${body.full_name}`,
                description: 'Colaborador admitido. Aguardando upload de documentos.',
                status: 'pending',
                priority: 7,
                module: 'Documentos',
                collaborator_id: collab.id,
            })
        }

        return NextResponse.json({ success: true, data: collab })
    } catch (error: any) {
        console.error('Error creating collaborator:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// DELETE collaborator
export async function DELETE(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID é obrigatório' },
                { status: 400 }
            )
        }

        const supabase = await createServiceClient()

        // Delete related records first (to avoid foreign key constraints)
        await (supabase as any).from('contracts').delete().eq('collaborator_id', id)
        await (supabase as any).from('epi_deliveries').delete().eq('collaborator_id', id)
        await (supabase as any).from('recess_requests').delete().eq('collaborator_id', id)
        await (supabase as any).from('pending_actions').delete().eq('collaborator_id', id)
        await (supabase as any).from('document_checklists').delete().eq('collaborator_id', id)

        // Delete the collaborator
        const { error } = await (supabase as any)
            .from('collaborators')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting collaborator:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
