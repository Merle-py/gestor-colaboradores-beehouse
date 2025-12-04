import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { access_token, domain, member_id } = body

    // 1. Valida se os dados vieram
    if (!access_token || !domain || !member_id) {
        throw createError({ statusCode: 400, message: 'Dados de autenticação inválidos' })
    }

    // 2. (Opcional) Aqui você faria uma chamada à API do Bitrix para validar se o token é real
    // const userBitrix = await $fetch(`https://${domain}/rest/user.current?auth=${access_token}`)

    const supabase = serverSupabaseServiceRole(event)

    // 3. Verifica se o usuário já existe no Supabase (pelo ID do Bitrix)
    const { data: user, error } = await supabase
        .from('profiles') // Supondo uma tabela 'profiles' ou 'users' vinculada
        .select('*')
        .eq('bitrix_id', member_id)
        .single()

    // Se não existir, você pode criar ou retornar erro. 
    // Para simplificar, vamos assumir que o usuário precisa existir ou criamos um básico.

    // 4. Gera o token de sessão do Supabase (Magic Link ou customizado)
    // Nota: Em produção real, recomenda-se usar o sistema de Auth do Supabase completo.
    // Aqui vamos retornar um sucesso simples para o front persistir o estado.

    return { success: true, user: user || { id: 'temp', name: 'Bitrix User' } }
})