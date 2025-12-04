// server/api/auth/dev.post.ts
import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw createError({ statusCode: 500, message: 'JWT_SECRET não configurado' })
    }

    const client = serverSupabaseServiceRole(event) as any
    const DEV_EMAIL = 'dev@beehouse.local'
    const DEV_BITRIX_ID = 999999

    // --- 1. Garante que o usuário existe no Supabase Auth ---
    let authUserId

    const { data: createdUser, error: authError } = await client.auth.admin.createUser({
        email: DEV_EMAIL,
        email_confirm: true,
        password: 'dev-password-secure-123',
        user_metadata: { bitrix_id: DEV_BITRIX_ID }
    })

    if (authError) {
        // Se já existe no Auth, recuperamos o ID dele
        if (authError.message?.includes('already has been registered') || authError.status === 422) {
            const { data: users } = await client.auth.admin.listUsers()
            const existing = users.users.find((u: any) => u.email === DEV_EMAIL)
            if (!existing) throw createError({ statusCode: 500, message: 'Erro crítico: Usuário Auth fantasma.' })
            authUserId = existing.id
        } else {
            throw createError({ statusCode: 500, message: 'Erro Auth: ' + authError.message })
        }
    } else {
        authUserId = createdUser.user.id
    }

    // --- 2. RESOLUÇÃO DE CONFLITOS (A LIMPEZA PROFUNDA) ---

    // Verifica se existe ALGUÉM (seja quem for) usando o bitrix_id 999999
    const { data: conflictUser } = await client
        .from('collaborators')
        .select('id')
        .eq('bitrix_id', DEV_BITRIX_ID)
        .maybeSingle()

    // Se existe alguém com esse Bitrix ID, e NÃO É o nosso usuário atual do Auth...
    if (conflictUser && conflictUser.id !== authUserId) {
        console.log(`[DevLogin] Conflito detectado. O bitrix_id pertence ao ID antigo: ${conflictUser.id}`)

        // A. Apaga registros dependentes (Foreign Keys) para liberar a exclusão
        // Adicione aqui outras tabelas se criar (ex: contracts, leaves)
        await client.from('audit_logs').delete().eq('collaborator_id', conflictUser.id)
        // await client.from('contracts').delete().eq('collaborator_id', conflictUser.id) 

        // B. Agora sim, apaga o colaborador antigo travado
        const { error: delError } = await client
            .from('collaborators')
            .delete()
            .eq('id', conflictUser.id)

        if (delError) {
            throw createError({ statusCode: 500, message: 'Não foi possível limpar o usuário antigo: ' + delError.message })
        }
        console.log('[DevLogin] Usuário antigo removido com sucesso.')
    }

    // --- 3. UPSERT (Cria ou Atualiza o usuário correto) ---
    const { error: upsertError } = await client
        .from('collaborators')
        .upsert({
            id: authUserId, // ID Oficial do Auth
            bitrix_id: DEV_BITRIX_ID,
            full_name: 'Desenvolvedor (Modo Dev)',
            email: DEV_EMAIL,
            status: 'ativo'
        }, { onConflict: 'id' })

    if (upsertError) {
        throw createError({ statusCode: 500, message: 'Erro ao salvar no banco: ' + upsertError.message })
    }

    // --- 4. GERA TOKEN E RETORNA ---
    const payload = {
        aud: 'authenticated',
        role: 'authenticated',
        sub: authUserId,
        email: DEV_EMAIL,
        user_metadata: { bitrix_id: DEV_BITRIX_ID },
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }

    const token = jwt.sign(payload, secret)

    return { success: true, token }
})