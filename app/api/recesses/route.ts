import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET all recess requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('recess_requests')
            .select('*, collaborators(full_name, email)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching recesses:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new recess request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        // Handle bulk insert for collective recesses
        if (body.collaborator_ids && Array.isArray(body.collaborator_ids)) {
            const inserts = body.collaborator_ids.map((collaborator_id: string) => ({
                collaborator_id,
                type: body.type || 'férias',
                start_date: body.start_date,
                end_date: body.end_date,
                status: body.status || 'scheduled',
                notes: body.notes || null,
            }))

            const { data, error } = await (supabase as any)
                .from('recess_requests')
                .insert(inserts)
                .select()

            if (error) throw error

            return NextResponse.json({ success: true, data, count: inserts.length })
        }

        // Single insert
        const { data, error } = await (supabase as any)
            .from('recess_requests')
            .insert({
                collaborator_id: body.collaborator_id,
                type: body.type || 'férias',
                start_date: body.start_date,
                end_date: body.end_date,
                status: body.status || 'scheduled',
                notes: body.notes || null,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating recess:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
