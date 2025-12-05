import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET all inventory items
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching materials:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new inventory item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('inventory_items')
            .insert({
                name: body.name,
                description: body.description || null,
                category: body.category || null,
                unit: body.unit || 'unidade',
                current_quantity: body.current_quantity || 0,
                minimum_quantity: body.minimum_quantity || 0,
                unit_cost: body.unit_cost ? parseFloat(body.unit_cost) : null,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating material:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
