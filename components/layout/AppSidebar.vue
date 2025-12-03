<template>
  <aside class="w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden md:flex">
    <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
      <span class="text-xl font-bold text-primary-600">Beehouse RH</span>
    </div>

    <div class="flex-1 overflow-y-auto py-4">
      <UVerticalNavigation :links="links" />
    </div>

    <div class="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 text-center">
      v1.0.0 (Beta)
    </div>
  </aside>
</template>

<script setup lang="ts">
// Definição dos links baseada nos Módulos do Doc [cite: 59, 60, 62, 64, 65, 66]
const links = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/'
  },
  {
    label: 'Colaboradores', // Módulo Cadastro Mestre
    icon: 'i-heroicons-users',
    to: '/colaboradores'
  },
  {
    label: 'Ausências & Recessos', // Módulo Gestão de Recessos
    icon: 'i-heroicons-calendar',
    to: '/ausencias'
  },
  {
    label: 'Materiais & EPIs', // Módulo Materiais
    icon: 'i-heroicons-archive-box',
    to: '/materiais'
  },
  {
    label: 'Financeiro', // Módulo Financeiro
    icon: 'i-heroicons-banknotes',
    to: '/financeiro'
  },
  {
    label: 'Relatórios', // Módulo BI
    icon: 'i-heroicons-chart-bar',
    to: '/relatorios'
  }
]
</script>