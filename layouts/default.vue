<template>
  <div class="flex h-screen overflow-hidden font-sans">
    
    <div class="hidden md:flex w-72 flex-col relative z-20 bg-zinc-950 text-white">
      
      <div class="flex flex-col h-full">
        <div class="h-20 flex items-center px-8 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-[#f9b410] flex items-center justify-center shadow-[0_0_15px_rgba(249,180,16,0.4)]">
              <UIcon name="i-heroicons-cube-transparent" class="w-5 h-5 text-black" />
            </div>
            <span class="text-lg font-bold tracking-wide text-white">Beehouse<span class="text-[#f9b410]">.RH</span></span>
          </div>
        </div>

        <div class="flex-1 py-6 px-4 overflow-y-auto">
          <UVerticalNavigation :links="links" :ui="{
            active: 'text-[#f9b410] bg-white/10 font-bold border-l-4 border-[#f9b410]',
            inactive: 'text-zinc-400 hover:text-white hover:bg-white/5',
            icon: {
              active: 'text-[#f9b410]',
              inactive: 'text-zinc-500 group-hover:text-white'
            }
          }" />
        </div>

        <div class="p-6 border-t border-white/10 bg-zinc-900/50">
          <div class="text-xs text-zinc-500 text-center">
            v1.0.0 &copy; Beehouse
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0 relative z-10 bg-gray-50">
      
      <header class="h-20 px-8 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm z-20">
        <div class="flex items-center gap-4">
          <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" class="md:hidden" />
          
          <div class="hidden md:block w-96 group">
            <UInput 
              icon="i-heroicons-magnifying-glass" 
              placeholder="Buscar..." 
              variant="outline"
              color="neutral"
              class="w-full rounded-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <UTooltip text="Nova Admissão">
            <UButton 
              icon="i-heroicons-plus" 
              class="rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              color="primary"
              to="/colaboradores/novo"
            />
          </UTooltip>

          <div class="h-8 w-px bg-gray-200 mx-2"></div>

          <UDropdown :items="userItems" :popper="{ placement: 'bottom-end' }">
            <UButton color="neutral" variant="ghost" class="gap-3 px-2 py-1">
              <UAvatar 
                src="https://avatars.githubusercontent.com/u/739984?v=4" 
                alt="Avatar" 
                size="md" 
                class="ring-2 ring-[#f9b410] ring-offset-2" 
              />
              <div class="hidden sm:flex flex-col items-start text-left">
                <span class="text-sm font-bold text-gray-900 leading-tight">RH Admin</span>
                <span class="text-[10px] text-gray-500 leading-tight">Beehouse</span>
              </div>
              <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-400" />
            </UButton>
          </UDropdown>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const links = [
  { 
    label: 'Dashboard', 
    icon: 'i-heroicons-home', 
    to: '/' 
  },
  { 
    label: 'Colaboradores', 
    icon: 'i-heroicons-users', 
    to: '/colaboradores' 
  },
  { 
    label: 'Admissão & Docs', 
    icon: 'i-heroicons-document-text', 
    to: '/documentos' 
  },
  { 
    label: 'Recessos & Ausências', 
    icon: 'i-heroicons-calendar', 
    to: '/ausencias' 
  },
  { 
    label: 'Materiais & EPIs', 
    icon: 'i-heroicons-archive-box', 
    to: '/materiais' 
  },
  { 
    label: 'Financeiro', 
    icon: 'i-heroicons-banknotes', 
    to: '/financeiro' 
  },
  { 
    label: 'Relatórios & BI', 
    icon: 'i-heroicons-chart-bar', 
    to: '/relatorios' 
  }
]

const userItems = [
  [{ label: 'Perfil', icon: 'i-heroicons-user-circle' }],
  [{ label: 'Sair', icon: 'i-heroicons-arrow-left-on-rectangle' }]
]
</script>