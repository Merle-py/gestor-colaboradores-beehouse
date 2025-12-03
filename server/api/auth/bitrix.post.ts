// server/api/auth/bitrix.post.ts
import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '../../../types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface BitrixUser {
    ID: string
    NAME: string
    LAST_NAME: string
}

interface BitrixResponse {
    result: BitrixUser
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { bitrixUserId, bitrixAccessToken, domain } = body

    // 1. SEGURANÇA: Validar se o usuário é real chamando a API do Bitrix
    // Isso garante que ninguém está "fingindo" ser o usuário 10
    const bitrixCheckUrl = `https://${domain}/rest/user.current.json?auth=${bitrixAccessToken}`
    const bitrixResponse = await $fetch<BitrixResponse>(bitrixCheckUrl).catch(() => null)

    if (!bitrixResponse || !bitrixResponse.result || bitrixResponse.result.ID != bitrixUserId) {
        throw createError({ statusCode: 401, statusMessage: 'Autenticação Bitrix inválida' })
    }

    // 2. Conectar ao Supabase com privilégios de admin para achar/criar o usuário
    // Using 'as any' to bypass persistent type inference issues in this environment
    const client = serverSupabaseServiceRole(event) as any

    // Verifica se esse usuário Bitrix já existe na tabela collaborators
    const { data: collaborator } = await client
        .from('collaborators')
        .select('id, department_id, full_name')
        .eq('bitrix_id', Number(bitrixUserId))
        .single()

    let userId = collaborator?.id

    // Se não existir, podemos criar automaticamente ou lançar erro (depende da sua regra)
    if (!userId) {
        // Exemplo: criar usuário básico
        const { data: newUser, error } = await client
            .from('collaborators')
            .insert({
                bitrix_id: Number(bitrixUserId),
                full_name: `${bitrixResponse.result.NAME} ${bitrixResponse.result.LAST_NAME}`,
                // Outros campos iniciais...
            })
            .select('id')
            .single()

        if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar usuário' })
        userId = newUser.id
    }

    // 3. LOG DE AUDITORIA (Login)
    await client.from('audit_logs').insert({
        collaborator_id: userId,
        bitrix_user_id: Number(bitrixUserId),
        action: 'LOGIN',
        entity: 'auth',
        details: { ip: event.node.req.socket.remoteAddress }
    })

    // 4. CRIPTOGRAFIA/TOKEN: Gerar JWT Customizado para o Supabase
    // Esse token permite que o Front-end obedeça ao RLS (Row Level Security)
    const payload = {
        aud: 'authenticated',
        role: 'authenticated',
        sub: userId, // O ID do usuário na tabela collaborators
        user_metadata: {
            bitrix_id: Number(bitrixUserId)
        },
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // Expira em 8 horas
    }

    if (!process.env.JWT_SECRET) {
        throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET não configurado' })
    }

    const supabaseToken = jwt.sign(payload, process.env.JWT_SECRET)

    return { token: supabaseToken }
})