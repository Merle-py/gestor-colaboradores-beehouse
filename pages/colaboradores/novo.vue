<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Novo Colaborador</h1>
      <p class="text-gray-500">Preencha os dados para cadastrar um novo funcionário ou prestador.</p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UCard>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="Nome Completo" name="full_name">
            <UInput v-model="state.full_name" />
          </UFormGroup>

          <UFormGroup label="Email" name="email">
            <UInput v-model="state.email" type="email" />
          </UFormGroup>

          <UFormGroup label="CPF" name="cpf">
            <UInput v-model="state.cpf" placeholder="000.000.000-00" />
          </UFormGroup>

          <UFormGroup label="Telefone" name="phone">
            <UInput v-model="state.phone" />
          </UFormGroup>

          <UFormGroup label="Departamento" name="department">
            <USelect v-model="state.department" :options="['TI', 'RH', 'Comercial', 'Operacional']" />
          </UFormGroup>

          <UFormGroup label="Cargo" name="role">
            <UInput v-model="state.role" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" to="/colaboradores">Cancelar</UButton>
            <UButton type="submit" color="primary" :loading="loading">Salvar Cadastro</UButton>
          </div>
        </template>
      </UCard>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const client = useSupabaseClient()
const loading = ref(false)

// Validação do formulário
const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  department: z.string().min(1, 'Selecione um departamento'),
  role: z.string().min(1, 'Cargo é obrigatório'),
  cpf: z.string().optional(),
  phone: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive({
  full_name: '',
  email: '',
  cpf: '',
  phone: '',
  department: 'TI',
  role: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const { error } = await client.from('collaborators').insert({
      full_name: event.data.full_name,
      email: event.data.email,
      // department_id: 1, // Ajustaremos isso quando a tabela departments estiver populada
      status: 'ativo'
    })

    if (error) throw error
    
    alert('Colaborador cadastrado com sucesso!')
    navigateTo('/colaboradores')
  } catch (e: any) {
    console.error(e)
    alert('Erro ao salvar: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>