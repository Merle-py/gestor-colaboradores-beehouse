// server/api/auth/bitrix.post.ts
import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'

// Interface para a resposta do Bitrix (mantemos para garantir que o fetch funcione)
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

    // 1. Validação Básica
    if (!bitrixUserId || !bitrixAccessToken || !domain) {
        throw createError({ statusCode: 400, statusMessage: 'Dados de autenticação incompletos' })
    }

    // 2. SEGURANÇA: Validação na API do Bitrix
    const bitrixCheckUrl = `https://${domain}/rest/user.current.json?auth=${bitrixAccessToken}`
    const bitrixResponse = await $fetch<BitrixResponse>(bitrixCheckUrl).catch(() => null)

    if (!bitrixResponse || !bitrixResponse.result || bitrixResponse.result.ID != bitrixUserId) {
        throw createError({ statusCode: 401, statusMessage: 'Token Bitrix inválido ou expirado' })
    }

    // 3. Conectar ao Supabase (SOLUÇÃO DEFINITIVA PARA O ERRO DE TIPAGEM)
    // Usamos 'as any' para ignorar a checagem estrita de tabelas do TypeScript neste arquivo.
    const client = serverSupabaseServiceRole(event) as any

    // 4. Verificar existência do colaborador
    const { data: collaborator } = await client
        .from('collaborators')
        .select('id')
        .eq('bitrix_id', Number(bitrixUserId))
        .single()

    let userId = collaborator?.id

    // 5. Auto-cadastro se não existir
    if (!userId) {
        const { data: newUser, error } = await client
            .from('collaborators')
            .insert({
                bitrix_id: Number(bitrixUserId),
                full_name: `${bitrixResponse.result.NAME} ${bitrixResponse.result.LAST_NAME}`,
                status: 'ativo' // Agora podemos passar o status sem erro
            })
            .select('id')
            .single()

        if (error) {
            console.error('Erro ao criar usuário:', error)
            throw createError({ statusCode: 500, statusMessage: 'Erro ao registrar usuário no banco' })
        }
        // Garante que newUser existe antes de acessar o ID
        if (newUser) {
            userId = newUser.id
        }
    }

    // 6. Trilha de Auditoria
    if (userId) {
        await client.from('audit_logs').insert({
            collaborator_id: userId,
            bitrix_user_id: Number(bitrixUserId),
            action: 'LOGIN',
            entity: 'auth',
            details: { ip: event.node.req.socket.remoteAddress || 'unknown' }
        })
    }

    // 7. Gerar Token JWT
    if (!process.env.JWT_SECRET) {
        throw createError({ statusCode: 500, statusMessage: 'Configuração JWT_SECRET ausente' })
    }

    const payload = {
        aud: 'authenticated',
        role: 'authenticated',
        sub: userId,
        user_metadata: {
            bitrix_id: Number(bitrixUserId)
        },
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 horas
    }

    const supabaseToken = jwt.sign(payload, process.env.JWT_SECRET)

    return { token: supabaseToken }
})