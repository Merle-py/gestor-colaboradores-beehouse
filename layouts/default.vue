<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <LayoutAppSidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <LayoutAppHeader />

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>