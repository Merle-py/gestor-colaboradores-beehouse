// server/api/auth/dev.post.ts
export default defineEventHandler(async (event) => {
    // Simula um usuário administrador logado
    return {
        success: true,
        user: {
            id: 'dev-admin-id',
            email: 'dev@beehouse.com',
            name: 'Desenvolvedor Master',
            role: 'admin',
            bitrix_id: 999999
        },
        token: 'dev-mock-token-123456' // Token fictício
    }
})