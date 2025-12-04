<template>
  <div class="max-w-5xl mx-auto py-6">
    <div class="flex items-center gap-4 mb-8">
      <UButton 
        icon="i-heroicons-arrow-left" 
        color="neutral" 
        variant="ghost" 
        to="/colaboradores"
        class="rounded-full hover:bg-gray-100"
      />
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Novo Colaborador</h1>
        <p class="text-gray-500">Preencha os dados para cadastrar um novo funcionário.</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <UForm :schema="schema" :state="state" class="p-8 space-y-6" @submit="onSubmit">
        
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-user" class="text-primary-500" />
            Dados Pessoais
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormGroup label="Nome Completo" name="full_name" class="text-gray-700">
              <UInput v-model="state.full_name" placeholder="Ex: João da Silva" class="w-full" />
            </UFormGroup>

            <UFormGroup label="Email Corporativo" name="email" class="text-gray-700">
              <UInput v-model="state.email" type="email" placeholder="joao@beehouse.com" class="w-full" />
            </UFormGroup>

            <UFormGroup label="CPF" name="cpf" class="text-gray-700">
              <UInput v-model="state.cpf" placeholder="000.000.000-00" class="w-full" />
            </UFormGroup>

            <UFormGroup label="Telefone / WhatsApp" name="phone" class="text-gray-700">
              <UInput v-model="state.phone" placeholder="(00) 90000-0000" class="w-full" />
            </UFormGroup>
          </div>
        </div>

        <div class="border-t border-gray-100 my-6"></div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-briefcase" class="text-primary-500" />
            Dados Contratuais
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormGroup label="Departamento" name="department" class="text-gray-700">
              <USelect 
                v-model="state.department" 
                :options="['Administrativo', 'Comercial', 'Financeiro', 'Marketing', 'Operacional', 'RH', 'TI']" 
                placeholder="Selecione..."
                class="w-full"
              />
            </UFormGroup>

            <UFormGroup label="Cargo / Função" name="role" class="text-gray-700">
              <UInput v-model="state.role" placeholder="Ex: Analista Pleno" class="w-full" />
            </UFormGroup>
          </div>
        </div>

        <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 mt-6">
          <UButton color="neutral" variant="ghost" to="/colaboradores">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" size="md" :loading="loading" icon="i-heroicons-check">
            Salvar Cadastro
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const client = useSupabaseClient() as any
const loading = ref(false)

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
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
  department: '',
  role: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const { error } = await client.from('collaborators').insert({
      full_name: event.data.full_name,
      email: event.data.email,
      status: 'ativo'
      // Outros campos serão adicionados conforme a tabela evoluir
    })

    if (error) throw error
    
    // Feedback visual simples ou redirecionamento
    alert('Colaborador cadastrado com sucesso!')
    navigateTo('/colaboradores')
  } catch (e: any) {
    console.error(e)
    alert('Erro ao salvar: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}
</script>