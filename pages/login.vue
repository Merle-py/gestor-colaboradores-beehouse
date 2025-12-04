<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
    <UCard class="w-full max-w-md text-center">
      <template #header>
        <h1 class="text-xl font-bold text-primary-600">Beehouse Gestor</h1>
        <p class="text-sm text-gray-500">Sistema de Colaboradores</p>
      </template>

      <div class="space-y-4 py-6">
        <div v-if="loading" class="flex flex-col items-center">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-primary-500" />
          <span class="mt-2 text-sm text-gray-600">Autenticando com Bitrix24...</span>
        </div>

        <div v-else>
          <p class="text-gray-600 mb-4">Aguardando conexão...</p>
          
          <div class="border-t pt-4 mt-4">
            <p class="text-xs text-gray-400 mb-2 uppercase font-bold">Área do Desenvolvedor</p>
            <UButton 
              color="gray" 
              variant="solid" 
              block 
              icon="i-heroicons-code-bracket"
              @click="handleDevLogin"
            >
              Entrar como DEV (Bypass)
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const loading = ref(true)
const router = useRouter()

// 1. Login de Desenvolvedor (Bypass)
const handleDevLogin = async () => {
  try {
    loading.value = true
    const { data, error } = await useFetch('/api/auth/dev', { method: 'POST' })
    
    if (data.value?.success) {
      // Salva estado global ou cookie
      const userCookie = useCookie('user')
      userCookie.value = data.value.user
      
      navigateTo('/colaboradores')
    }
  } catch (e) {
    console.error('Erro no login dev:', e)
  } finally {
    loading.value = false
  }
}

// 2. Login Bitrix (Automático ao carregar)
onMounted(async () => {
  // Verifica se estamos dentro do iframe do Bitrix
  // Exemplo simples: verifica query params ou objeto BX24 global
  // Se não estiver no Bitrix e não for dev, para o loading
  loading.value = false
  
  // Lógica real do Bitrix viria aqui:
  // BX24.init(...) -> pega token -> chama /api/auth/bitrix
})

definePageMeta({
  layout: 'blank'
})
</script>