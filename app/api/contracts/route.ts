import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateAuth, unauthorizedResponse } from '@/lib/auth/validate'

// GET all contracts
export async function GET(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const supabase = await createServiceClient()

        const { searchParams } = new URL(request.url)
        const collaboratorId = searchParams.get('collaborator_id')

        let query = (supabase as any)
            .from('contracts')
            .select('*, collaborators(full_name, email)')
            .order('created_at', { ascending: false })

        if (collaboratorId) {
            query = query.eq('collaborator_id', collaboratorId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching contracts:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new contract
export async function POST(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('contracts')
            .insert({
                collaborator_id: body.collaborator_id,
                contract_type: body.contract_type || 'CLT',
                start_date: body.start_date,
                end_date: body.end_date || null,
                monthly_value: body.monthly_value ? parseFloat(body.monthly_value) : null,
                payment_day: parseInt(body.payment_day) || 5,
                work_hours_per_week: parseInt(body.work_hours_per_week) || 40,
                status: body.status || 'active',
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating contract:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
