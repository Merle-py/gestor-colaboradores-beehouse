import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateAuth, unauthorizedResponse } from '@/lib/auth/validate'

// GET all bills with filters
export async function GET(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const supabase = await createServiceClient()
        const { searchParams } = new URL(request.url)

        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const category = searchParams.get('category')
        const month = searchParams.get('month') // YYYY-MM format

        let query = (supabase as any)
            .from('bills')
            .select('*, collaborators(full_name)')
            .order('due_date', { ascending: true })

        if (status) {
            query = query.eq('status', status)
        }
        if (type) {
            query = query.eq('type', type)
        }
        if (category) {
            query = query.eq('category', category)
        }
        if (month) {
            const startDate = `${month}-01`
            const endDate = `${month}-31`
            query = query.gte('due_date', startDate).lte('due_date', endDate)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error fetching bills:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST create new bill
export async function POST(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        const { data, error } = await (supabase as any)
            .from('bills')
            .insert({
                description: body.description,
                category: body.category,
                type: body.type || 'pagar',
                amount: parseFloat(body.amount),
                due_date: body.due_date,
                payment_date: body.payment_date || null,
                competence_month: body.competence_month || null,
                status: body.status || 'pending',
                is_recurring: body.is_recurring || false,
                recurrence_type: body.recurrence_type || null,
                recurrence_end_date: body.recurrence_end_date || null,
                collaborator_id: body.collaborator_id || null,
                contract_id: body.contract_id || null,
                supplier_name: body.supplier_name || null,
                document_number: body.document_number || null,
                barcode: body.barcode || null,
                notes: body.notes || null,
                file_url: body.file_url || null,
            })
            .select()
            .single()

        if (error) throw error

        // Create recurring bills if needed
        if (body.is_recurring && body.recurrence_type === 'monthly') {
            await createRecurringBills(supabase, data, body)
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error creating bill:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// PUT update bill (mark as paid, update status, etc)
export async function PUT(request: NextRequest) {
    const auth = await validateAuth(request)
    if (!auth.isValid) {
        return unauthorizedResponse(auth.error)
    }

    try {
        const body = await request.json()
        const supabase = await createServiceClient()

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'ID é obrigatório' },
                { status: 400 }
            )
        }

        const updateData: any = {
            updated_at: new Date().toISOString(),
        }

        // Update allowed fields
        if (body.status) updateData.status = body.status
        if (body.payment_date) updateData.payment_date = body.payment_date
        if (body.paid_amount !== undefined) updateData.paid_amount = parseFloat(body.paid_amount)
        if (body.description) updateData.description = body.description
        if (body.amount) updateData.amount = parseFloat(body.amount)
        if (body.due_date) updateData.due_date = body.due_date
        if (body.notes !== undefined) updateData.notes = body.notes

        // If marking as paid
        if (body.status === 'paid' && !body.payment_date) {
            updateData.payment_date = new Date().toISOString().split('T')[0]
            updateData.paid_amount = body.paid_amount || body.amount
        }

        const { data, error } = await (supabase as any)
            .from('bills')
            .update(updateData)
            .eq('id', body.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error updating bill:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// DELETE bill
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

        const { error } = await (supabase as any)
            .from('bills')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting bill:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Helper to create recurring bills
async function createRecurringBills(supabase: any, parentBill: any, body: any) {
    const endDate = body.recurrence_end_date
        ? new Date(body.recurrence_end_date)
        : new Date(new Date().setMonth(new Date().getMonth() + 12)) // Default 12 months

    let currentDate = new Date(body.due_date)
    const bills = []

    while (currentDate <= endDate) {
        currentDate.setMonth(currentDate.getMonth() + 1)

        if (currentDate > endDate) break

        bills.push({
            description: body.description,
            category: body.category,
            type: body.type || 'pagar',
            amount: parseFloat(body.amount),
            due_date: currentDate.toISOString().split('T')[0],
            status: 'pending',
            is_recurring: true,
            recurrence_type: body.recurrence_type,
            parent_bill_id: parentBill.id,
            supplier_name: body.supplier_name || null,
            notes: body.notes || null,
        })
    }

    if (bills.length > 0) {
        await supabase.from('bills').insert(bills)
    }
}
