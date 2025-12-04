// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
    const user = useSupabaseUser()

    // Lista de rotas públicas (que não precisam de login)
    const publicRoutes = ['/login']

    // Se o usuário NÃO estiver logado e tentar acessar uma página protegida
    if (!user.value && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }

    // Se o usuário JÁ estiver logado e tentar ir para o login
    if (user.value && to.path === '/login') {
        return navigateTo('/')
    }
})