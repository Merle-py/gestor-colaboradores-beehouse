<script setup>
// Redireciona automaticamente para o módulo de Colaboradores
await navigateTo('/colaboradores')
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary-500" />
    <span class="ml-2 text-gray-500">Redirecionando para o painel...</span>
  </div>
</template>