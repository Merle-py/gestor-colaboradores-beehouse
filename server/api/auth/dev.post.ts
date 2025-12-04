import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const secret = process.env.JWT_SECRET
    if (!secret) throw createError({ statusCode: 500, message: 'JWT_SECRET ausente' })

    const client = serverSupabaseServiceRole(event) as any
    const DEV_EMAIL = 'dev@beehouse.local'
    const DEV_BITRIX_ID = 999999

    // 1. Garante usuário no Auth (Identity)
    let authUserId
    const { data: usersList } = await client.auth.admin.listUsers()
    const existingAuth = usersList.users.find((u: any) => u.email === DEV_EMAIL)

    if (existingAuth) {
        authUserId = existingAuth.id
    } else {
        const { data: newAuth, error: createError } = await client.auth.admin.createUser({
            email: DEV_EMAIL,
            email_confirm: true,
            password: 'dev-password-secure-123',
            user_metadata: { bitrix_id: DEV_BITRIX_ID }
        })
        if (createError) throw createError({ statusCode: 500, message: createError.message })
        authUserId = newAuth.user.id
    }

    // 2. LIMPEZA CIRÚRGICA (Remove duplicatas antes de inserir)
    await client.from('collaborators').delete().eq('bitrix_id', DEV_BITRIX_ID).neq('id', authUserId)

    // 3. Upsert na tabela pública
    const { error: upsertError } = await client
        .from('collaborators')
        .upsert({
            id: authUserId,
            bitrix_id: DEV_BITRIX_ID,
            full_name: 'Desenvolvedor (Modo Dev)',
            email: DEV_EMAIL,
            status: 'ativo'
        }, { onConflict: 'id' })

    if (upsertError) {
        throw createError({ statusCode: 500, message: 'Erro DB: ' + upsertError.message })
    }

    // 4. Token
    const token = jwt.sign({
        aud: 'authenticated',
        role: 'authenticated',
        sub: authUserId,
        email: DEV_EMAIL,
        user_metadata: { bitrix_id: DEV_BITRIX_ID },
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }, secret)

    return { success: true, token }
})