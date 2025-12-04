<template>
  <div class="p-6">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cadastro Mestre</h1>
        <p class="text-gray-500">Gerencie todos os colaboradores e prestadores</p>
      </div>
      <UButton icon="i-heroicons-plus" to="/colaboradores/novo">Novo Colaborador</UButton>
    </header>

    <UCard>
      <UTable 
        :rows="colaboradores" 
        :columns="columns" 
        :loading="pending"
      >
        <template #nome-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="row.nome" />
            <div>
              <p class="font-medium text-gray-900">{{ row.nome }}</p>
              <p class="text-xs text-gray-500">{{ row.cargo || 'Sem cargo' }}</p>
            </div>
          </div>
        </template>

        <template #status-data="{ row }">
          <UBadge :color="row.ativo ? 'green' : 'red'" variant="subtle">
            {{ row.ativo ? 'Ativo' : 'Inativo' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="items(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

// Definição das colunas
const columns = [
  { key: 'nome', label: 'Colaborador' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'tipo_contrato', label: 'Contrato' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações', sortable: false }
]

// Busca dados do Supabase
const { data: colaboradores, pending } = await useAsyncData('colaboradores', async () => {
  const { data } = await supabase
    .from('collaborators') // Certifique-se que o nome da tabela no Supabase é este
    .select('*')
    .order('created_at', { ascending: false })
  return data
})

// Ações do menu dropdown
const items = (row) => [
  [{
    label: 'Editar',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => console.log('Edit', row.id)
  }, {
    label: 'Arquivar',
    icon: 'i-heroicons-archive-box-20-solid'
  }]
]
</script>