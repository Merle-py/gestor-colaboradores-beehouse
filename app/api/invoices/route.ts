import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateAuth, unauthorizedResponse } from '@/lib/auth/validate'

// GET all invoices (notas fiscais)
export async function GET(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('notas_fiscais')
            .select('*, contracts(collaborator_id, collaborators(full_name))')
            .order('issue_date', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new invoice
export async function POST(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('notas_fiscais')
            .insert({
                contract_id: body.contract_id,
                number: body.number,
                issue_date: body.issue_date,
                due_date: body.due_date,
                amount: body.amount ? parseFloat(body.amount) : null,
                status: body.status || 'pending',
                file_url: body.file_url || null,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating invoice:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
