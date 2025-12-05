import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET all EPI deliveries
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('epi_deliveries')
            .select('*, collaborators(full_name), inventory_items(name)')
            .order('delivery_date', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching deliveries:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new EPI delivery
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('epi_deliveries')
            .insert({
                collaborator_id: body.collaborator_id,
                item_id: body.item_id,
                quantity: body.quantity || 1,
                delivery_date: body.delivery_date || new Date().toISOString().split('T')[0],
                return_date: body.return_date || null,
                notes: body.notes || null,
            })
            .select()
            .single()

        if (error) throw error

        // Update inventory quantity
        if (body.item_id && body.quantity) {
            await (supabase as any).rpc('decrement_inventory', {
                item_id: body.item_id,
                qty: body.quantity
            }).catch(() => {
                // RPC might not exist, try direct update
                console.log('RPC not available, skipping inventory update')
            })
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating delivery:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
