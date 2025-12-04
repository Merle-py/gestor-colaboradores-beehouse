<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Colaboradores</h1>
        <p class="text-gray-500 mt-1">Gerencie o time e os contratos da Beehouse.</p>
      </div>
      
      <UButton 
        icon="i-heroicons-plus" 
        label="Novo Colaborador" 
        color="primary" 
        size="md"
        class="font-bold px-6 shadow-lg shadow-primary-500/20"
        to="/colaboradores/novo"
      />
    </div>

    <div class="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
        <div class="w-full md:w-72">
          <UInput 
            v-model="search" 
            icon="i-heroicons-magnifying-glass" 
            placeholder="Buscar colaborador..." 
            color="neutral"
            class="w-full"
          />
        </div>
        
        <div class="flex gap-2">
           <UButton 
             v-for="status in ['Todos', 'Ativo', 'Afastado']" 
             :key="status"
             :label="status"
             :variant="statusFilter === status ? 'solid' : 'ghost'"
             :color="statusFilter === status ? 'neutral' : 'neutral'"
             size="xs"
             class="px-3"
             @click="statusFilter = status"
           />
        </div>
      </div>

      <UTable 
        :rows="$any(filteredRows)" 
        :columns="columns" 
        :loading="pending"
        class="w-full"
      >
        <template #name-data="{ row }">
          <div class="flex items-center gap-4 py-1">
            <UAvatar :alt="$any(row).full_name" size="md" class="bg-gray-100 text-gray-600" />
            <div>
              <p class="font-semibold text-gray-900 text-sm">{{ $any(row).full_name }}</p>
              <p class="text-xs text-gray-500">{{ $any(row).email }}</p>
            </div>
          </div>
        </template>

        <template #department-data="{ row }">
          <UBadge color="neutral" variant="subtle" size="xs" :label="$any(row).department" />
        </template>

        <template #status-data="{ row }">
          <UBadge 
            :color="getStatusColor($any(row).status)" 
            variant="subtle" 
            size="xs"
            class="capitalize"
          >
            {{ $any(row).status || 'N/A' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex justify-end">
            <UDropdown :items="getActionItems(row)">
              <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-vertical" />
            </UDropdown>
          </div>
        </template>
      </UTable>
      
      <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
        <span class="text-xs text-gray-500">Mostrando {{ filteredRows.length }} resultados</span>
        <UPagination v-model="page" :total="collaborators?.length || 0" :page-count="10" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

const $any = (val: any) => val

const columns: any[] = [
  { key: 'name', label: 'Colaborador', id: 'name' },
  { key: 'department', label: 'Departamento', id: 'department' },
  { key: 'status', label: 'Status', id: 'status' },
  { key: 'actions', label: '', id: 'actions' }
]

const search = ref('')
const statusFilter = ref('Todos')
const page = ref(1)
const client = useSupabaseClient<Database>()

const { data: collaborators, pending } = await useAsyncData('collaborators', async () => {
  const { data, error } = await client
    .from('collaborators')
    .select('id, full_name, email, status')
    .order('created_at', { ascending: false })

  if (error) return []
  
  return (data as any[]).map(c => ({
    id: c.id,
    full_name: c.full_name || 'Sem Nome',
    email: c.email || '-',
    department: 'TI', 
    status: c.status || 'ativo'
  }))
})

const filteredRows = computed(() => {
  if (!collaborators.value) return []
  return collaborators.value.filter((p: any) => {
    const s = search.value.toLowerCase()
    const matchesSearch = p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s)
    const matchesStatus = statusFilter.value === 'Todos' || p.status === statusFilter.value.toLowerCase()
    return matchesSearch && matchesStatus
  })
})

const getStatusColor = (s: string): 'success' | 'warning' | 'error' | 'neutral' => {
  if (s === 'ativo') return 'success'
  if (s === 'afastado') return 'warning'
  if (s === 'desligado') return 'error'
  return 'neutral'
}

const getActionItems = (row: any) => [[{
  label: 'Editar',
  icon: 'i-heroicons-pencil-square-20-solid',
  click: () => navigateTo(`/colaboradores/${row.id}`)
}]]
</script>