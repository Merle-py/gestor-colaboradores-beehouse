export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    // Se estiver na página de login, e o usuário estiver logado, manda pra home
    if (user.value && to.path === '/login') {
        return navigateTo('/')
    }

    // Se NÃO estiver logado, e tentar acessar qualquer outra página, manda pro login
    if (!user.value && to.path !== '/login') {
        return navigateTo('/login')
    }
})