<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
defineOptions({ name: 'AdminTenantLifecycleView' })
</script>

<template>
  <div class="page-container">
    <PageHeader title="租户生命周期管理" subtitle="全量展示所有入驻学校租户" />
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}
</style>