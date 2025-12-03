<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    
    <div class="flex items-center gap-4">
      <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" class="md:hidden" />
      
      <div class="hidden md:block w-96">
        <UInput 
          icon="i-heroicons-magnifying-glass" 
          placeholder="Buscar colaboradores, contratos ou documentos..." 
          color="neutral" 
          variant="outline"
        />
      </div>
    </div>

    <div class="flex items-center gap-3">
      
      <UTooltip text="Nova Admissão / Cadastro">
        <UButton icon="i-heroicons-plus" color="primary" variant="solid" size="sm" to="/colaboradores/novo" />
      </UTooltip>

      <UChip text="3" color="error" size="2xl">
        <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" />
      </UChip>

      <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

      <UDropdown :items="userItems" :popper="{ placement: 'bottom-end' }">
        <UButton color="neutral" variant="ghost" class="gap-2">
          <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="xs" />
          <span class="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
            RH Beehouse
          </span>
          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-400" />
        </UButton>
      </UDropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
// Opções do menu de perfil
const userItems = [
  [{
    label: 'Minha Conta',
    icon: 'i-heroicons-user-circle'
  }],
  [{
    label: 'Sair',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: () => console.log('Logout logic here')
  }]
]
</script>