import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { access_token, domain, member_id } = body

        // 1. Valida se os dados vieram
        if (!access_token || !domain || !member_id) {
            return NextResponse.json(
                { error: 'Dados de autenticação inválidos' },
                { status: 400 }
            )
        }

        // 2. (Opcional) Aqui você faria uma chamada à API do Bitrix para validar se o token é real
        // const userBitrix = await fetch(`https://${domain}/rest/user.current?auth=${access_token}`)

        const supabase = await createServiceClient()

        // 3. Verifica se o usuário já existe no Supabase (pelo ID do Bitrix)
        const { data: user, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('bitrix_id', member_id)
            .single()

        // Se não existir, você pode criar ou retornar erro.
        // Para simplificar, vamos assumir que o usuário precisa existir ou criamos um básico.

        return NextResponse.json({
            success: true,
            user: user || { id: 'temp', name: 'Bitrix User' },
        })
    } catch (error: any) {
        console.error('Bitrix auth error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
