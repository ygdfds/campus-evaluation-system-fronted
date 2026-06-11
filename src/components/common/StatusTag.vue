<script setup>
import { computed } from 'vue'

defineOptions({ name: 'StatusTag' })

const props = defineProps({
  /** 状态值 */
  status: { type: [String, Number], required: true },
  /** 状态映射配置: { [value]: { label, type } } */
  statusMap: { type: Object, default: () => ({}) },
})

const tagInfo = computed(() => {
  return props.statusMap[props.status] || { label: props.status, type: 'info' }
})
</script>

<template>
  <el-tag :type="tagInfo.type" size="small" effect="light">
    {{ tagInfo.label }}
  </el-tag>
</template>
