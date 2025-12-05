import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET all inventory movements
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('inventory_movements')
            .select('*, inventory_items(name)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching movements:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new inventory movement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('inventory_movements')
            .insert({
                item_id: body.item_id,
                movement_type: body.movement_type, // 'entrada' or 'saida'
                quantity: body.quantity,
                reason: body.reason || null,
                notes: body.notes || null,
            })
            .select()
            .single()

        if (error) throw error

        // Update inventory quantity
        if (body.item_id && body.quantity) {
            const delta = body.movement_type === 'entrada' ? body.quantity : -body.quantity
            await (supabase as any)
                .from('inventory_items')
                .update({
                    current_quantity: (supabase as any).rpc('increment', { inc: delta })
                })
                .eq('id', body.item_id)
                .catch(() => {
                    console.log('Inventory update skipped')
                })
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating movement:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
