import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const secret = process.env.JWT_SECRET
        if (!secret) {
            return NextResponse.json({ error: 'JWT_SECRET ausente' }, { status: 500 })
        }

        const client = await createServiceClient() as any
        const DEV_EMAIL = 'dev@beehouse.local'
        const DEV_BITRIX_ID = 999999

        // 1. Garante usuário no Auth (Identity)
        let authUserId
        const { data: usersList } = await client.auth.admin.listUsers()
        const existingAuth = usersList?.users?.find((u: any) => u.email === DEV_EMAIL)

        if (existingAuth) {
            authUserId = existingAuth.id
        } else {
            const { data: newAuth, error: createError } = await client.auth.admin.createUser({
                email: DEV_EMAIL,
                email_confirm: true,
                password: 'dev-password-secure-123',
                user_metadata: { bitrix_id: DEV_BITRIX_ID },
            })
            if (createError) {
                return NextResponse.json({ error: createError.message }, { status: 500 })
            }
            authUserId = newAuth.user.id
        }

        // 2. Limpeza de duplicatas
        await client
            .from('collaborators')
            .delete()
            .eq('bitrix_id', DEV_BITRIX_ID)
            .neq('id', authUserId)

        // 3. Upsert na tabela pública
        const { error: upsertError } = await client.from('collaborators').upsert(
            {
                id: authUserId,
                bitrix_id: DEV_BITRIX_ID,
                full_name: 'Desenvolvedor (Modo Dev)',
                email: DEV_EMAIL,
                status: 'ativo',
            },
            { onConflict: 'id' }
        )

        if (upsertError) {
            return NextResponse.json(
                { error: 'Erro DB: ' + upsertError.message },
                { status: 500 }
            )
        }

        // 4. Token
        const token = jwt.sign(
            {
                aud: 'authenticated',
                role: 'authenticated',
                sub: authUserId,
                email: DEV_EMAIL,
                user_metadata: { bitrix_id: DEV_BITRIX_ID },
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            },
            secret
        )

        return NextResponse.json({ success: true, token })
    } catch (error: any) {
        console.error('Dev login error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
