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

    <UCard :ui="{ body: { padding: 'p-0' } }">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar por nome..." />
        <USelect v-model="statusFilter" :options="['Todos', 'Ativo', 'Afastado', 'Desligado']" />
      </div>

      <UTable 
        :rows="filteredRows" 
        :columns="columns" 
        :loading="pending"
      >
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="row.full_name" size="xs" />
            <span class="font-medium text-gray-900 dark:text-white">{{ row.full_name }}</span>
          </div>
        </template>

        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)" variant="subtle" size="xs">
            {{ row.status ? row.status.toUpperCase() : 'N/A' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="getActionItems(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
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

// Definição das colunas da tabela
const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Departamento' },
  { key: 'status', label: 'Status' },
  { key: 'actions' }
]

const search =ref('')
const statusFilter = ref('Todos')
const page = ref(1)

// Conexão com Supabase
const client = useSupabaseClient<Database>()

// Busca de dados (Fetch)
const { data: collaborators, pending, refresh } = await useAsyncData('collaborators', async () => {
  // Nota: Estou assumindo que criamos a tabela 'departments' e fizemos o relacionamento no SQL
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
  
  // Mapeando para formato da tabela
  return data.map(c => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email || '-',
    status: c.status || 'ativo',
    // @ts-ignore: O Supabase retorna array ou objeto dependendo da relação, ajustamos aqui
    department: c.departments?.name || '-' 
  }))
})

// Filtragem no Front-end (Para MVP é mais rápido que refazer a query)
const filteredRows = computed(() => {
  if (!collaborators.value) return []
  
  return collaborators.value.filter(person => {
    const matchesSearch = person.full_name.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'Todos' || person.status === statusFilter.value.toLowerCase()
    return matchesSearch && matchesStatus
  })
})

// Helpers Visuais
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativo': return 'green'
    case 'afastado': return 'orange'
    case 'desligado': return 'red'
    default: return 'gray'
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