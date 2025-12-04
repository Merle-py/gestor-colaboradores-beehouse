<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Colaboradores</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie o cadastro de todos os funcionários e prestadores.</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" to="/colaboradores/novo">
        Novo Colaborador
      </UButton>
    </div>

    <UCard class="p-0">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar por nome..." />
        <USelect v-model="statusFilter" :options="['Todos', 'Ativo', 'Afastado', 'Desligado']" />
      </div>

      <UTable 
        :rows="$any(filteredRows)" 
        :columns="columns" 
        :loading="pending"
      >
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="$any(row).full_name" size="xs" />
            <span class="font-medium text-gray-900 dark:text-white">{{ $any(row).full_name }}</span>
          </div>
        </template>

        <template #status-data="{ row }">
          <UBadge :color="getStatusColor($any(row).status)" variant="subtle" size="xs">
            {{ $any(row).status ? $any(row).status.toUpperCase() : 'N/A' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="getActionItems(row)">
            <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <UPagination v-model="page" :total="collaborators?.length || 0" :page-count="10" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

// Função auxiliar para desligar a tipagem estrita no template (se necessário)
const $any = (val: any) => val

// CORREÇÃO FINAL: Tipagem explicita ': any[]' elimina o erro de tipo incompatível na definição
const columns: any[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Departamento' },
  { key: 'status', label: 'Status' },
  { key: 'actions' }
]

const search = ref('')
const statusFilter = ref('Todos')
const page = ref(1)

const client = useSupabaseClient<Database>()

const { data: collaborators, pending } = await useAsyncData('collaborators', async () => {
  const { data, error } = await client
    .from('collaborators')
    .select(`
      id, 
      full_name, 
      email, 
      status, 
      departments ( name )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar colaboradores:', error)
    return []
  }
  
  const rawData = data as any[]

  return rawData.map(c => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email || '-',
    status: c.status || 'ativo',
    department: c.departments?.name || '-' 
  }))
})

const filteredRows = computed(() => {
  if (!collaborators.value) return []
  
  return collaborators.value.filter((person: any) => {
    const matchesSearch = person.full_name.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'Todos' || person.status === statusFilter.value.toLowerCase()
    return matchesSearch && matchesStatus
  })
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativo': return 'success'
    case 'afastado': return 'warning'
    case 'desligado': return 'error'
    default: return 'neutral'
  }
}

const getActionItems = (row: any) => [
  [{
    label: 'Editar',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => navigateTo(`/colaboradores/${row.id}`)
  }, {
    label: 'Ver Documentos',
    icon: 'i-heroicons-document-text-20-solid',
    click: () => navigateTo(`/colaboradores/${row.id}?tab=docs`)
  }]
]
</script>