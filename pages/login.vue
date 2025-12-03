<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <UCard class="w-full max-w-md text-center p-6">
      <div class="flex justify-center mb-6">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-primary-500 animate-spin" />
      </div>
      
      <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Conectando ao Bitrix24...
      </h1>
      <p class="text-gray-500 text-sm mb-6">
        Validando suas credenciais de acesso.
      </p>

      <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-md text-sm text-left">
        <p class="font-bold">Erro de Autenticação:</p>
        <p>{{ error }}</p>
        <UButton 
          size="xs" 
          color="red" 
          variant="soft" 
          class="mt-2"
          @click="retryLogin"
        >
          Tentar Novamente
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const error = ref(null)

// Carrega o script do Bitrix dinamicamente
useHead({
  script: [
    {
      src: 'https://api.bitrix24.com/api/v1/',
      async: true,
      defer: true,
      onload: () => initBitrixAuth() // Inicia assim que carregar
    }
  ]
})

function initBitrixAuth() {
  // Verifica se o BX24 foi carregado (contexto do iframe)
  if (typeof BX24 === 'undefined') {
    // Se não estiver no iframe, tentamos pegar parâmetros da URL (fallback)
    const route = useRoute()
    if (route.query.AUTH_ID) {
      handleAuth({
        access_token: route.query.AUTH_ID,
        member_id: route.query.MEMBER_ID,
        domain: route.query.DOMAIN
      })
    } else {
      error.value = "Ambiente Bitrix24 não detectado. Abra este app dentro do portal."
    }
    return
  }

  // Inicializa a biblioteca do Bitrix
  BX24.init(() => {
    // Pega a autenticação atual do usuário
    const auth = BX24.getAuth()
    if (!auth) {
      BX24.login() // Força o login se não tiver sessão
      return
    }
    handleAuth(auth)
  })
}

async function handleAuth(authData) {
  try {
    error.value = null
    
    // 1. Chama nossa API (Backend) para validar e criar sessão
    const { token } = await $fetch('/api/auth/bitrix', {
      method: 'POST',
      body: {
        bitrixUserId: authData.member_id || authData.user_id, // Bitrix varia o nome as vezes
        bitrixAccessToken: authData.access_token,
        domain: authData.domain
      }
    })

    if (!token) throw new Error("Token de sessão não gerado.")

    // 2. Salva a sessão no Supabase (Cliente)
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token
    })

    if (sessionError) throw sessionError

    // 3. Sucesso! Vai para o Dashboard
    return navigateTo('/')

  } catch (e) {
    console.error(e)
    error.value = e.message || "Falha ao comunicar com o servidor."
  }
}

const retryLogin = () => {
  window.location.reload()
}
</script>