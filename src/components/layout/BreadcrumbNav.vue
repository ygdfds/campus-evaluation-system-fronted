<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'BreadcrumbNav' })

defineProps({
  /** 自定义面包屑项: [{ title, path? }] */
  items: { type: Array, default: () => [] },
})

const route = useRoute()

const breadcrumbs = computed(() => {
  const matched = route.matched
    .filter((r) => r.meta?.title)
    .map((r) => ({ title: r.meta.title, path: r.path }))
  return matched
})
</script>

<template>
  <el-breadcrumb separator="/" class="breadcrumb-nav">
    <el-breadcrumb-item
      v-for="(item, index) in (items.length ? items : breadcrumbs)"
      :key="index"
      :to="item.path ? { path: item.path } : undefined"
    >
      {{ item.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped>
.breadcrumb-nav {
  margin-bottom: var(--space-4);
}
</style>
