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

      <div class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs text-gray-400 mb-2">Modo Desenvolvimento</p>
        <UButton block color="gray" variant="solid" @click="handleDevLogin">
          Entrar como Admin (Bypass)
        </UButton>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm text-left">
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
// Define layout limpo (sem menu lateral)
definePageMeta({
  layout: 'blank'
})

// 1. Definição do Cliente Supabase (Obrigatório estar aqui no topo)
const supabase = useSupabaseClient()
const error = ref(null)
const loading = ref(true)

// --- LÓGICA DE LOGIN DESENVOLVEDOR (BYPASS) ---
const handleDevLogin = async () => {
  try {
    loading.value = true
    
    // Chama a API de dev que cria o token
    const { data, error: fetchError } = await useFetch('/api/auth/dev', { method: 'POST' })
    
    if (fetchError.value) throw fetchError.value

    if (data.value?.token) {
      console.log('Login Dev: Token recebido, iniciando sessão...')
      
      // Injeta o token no cliente do Supabase
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.value.token,
        refresh_token: data.value.token
      })
      
      if (sessionError) throw sessionError
      
      // Sucesso: Redireciona
      await navigateTo('/colaboradores')
    }
  } catch (e) {
    console.error('Erro no login dev:', e)
    error.value = 'Erro ao entrar como Dev: ' + (e.message || e)
  } finally {
    loading.value = false
  }
}

// --- LÓGICA DE LOGIN BITRIX (PRODUÇÃO) ---
// Carrega o script do Bitrix dinamicamente
useHead({
  script: [
    {
      src: 'https://api.bitrix24.com/api/v1/',
      async: true,
      defer: true,
      onload: () => initBitrixAuth()
    }
  ]
})

function initBitrixAuth() {
  if (typeof BX24 === 'undefined') {
    // Tenta pegar da URL se não estiver no iframe
    const route = useRoute()
    if (route.query.AUTH_ID) {
      handleAuth({
        access_token: route.query.AUTH_ID,
        member_id: route.query.MEMBER_ID,
        domain: route.query.DOMAIN
      })
    } else {
      // Apenas mostra erro se não clicarmos no botão de Dev
      // error.value = "Ambiente Bitrix24 não detectado."
    }
    return
  }

  BX24.init(() => {
    const auth = BX24.getAuth()
    if (!auth) {
      BX24.login()
      return
    }
    handleAuth(auth)
  })
}

async function handleAuth(authData) {
  try {
    error.value = null
    
    const { token } = await $fetch('/api/auth/bitrix', {
      method: 'POST',
      body: {
        bitrixUserId: authData.member_id || authData.user_id,
        bitrixAccessToken: authData.access_token,
        domain: authData.domain
      }
    })

    if (!token) throw new Error("Token de sessão não gerado.")

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token
    })

    if (sessionError) throw sessionError

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