<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getSystemSettingsApi, saveSystemSettingsApi } from '@/api/system'

defineOptions({ name: 'AdminSystemSettingsView' })

const settingsForm = ref({})

const fetchSettings = async () => {
  const response = await getSystemSettingsApi()
  settingsForm.value = response.data || {}
}

const handleSave = async () => {
  await saveSystemSettingsApi(settingsForm.value)
  ElMessage.success('配置已保存')
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="系统全局配置" 
      subtitle="平台基础配置与业务规则设置" 
    />
    
    <PageSection>
      <el-form :model="settingsForm" label-width="180px">
        <!-- 短信模板配置 -->
        <el-form-item label="入驻通知短信模板">
          <el-input 
            v-model="settingsForm.onboardingNotificationTemplate" 
            type="textarea" 
            :rows="3"
            placeholder="请输入短信模板内容"
          />
        </el-form-item>
        
        <el-form-item label="到期预警短信模板">
          <el-input 
            v-model="settingsForm.expirationWarningTemplate" 
            type="textarea" 
            :rows="3"
            placeholder="请输入短信模板内容"
          />
        </el-form-item>

        <!-- 敏感词库配置 -->
        <el-form-item label="评价敏感词库">
          <el-input 
            v-model="settingsForm.sensitiveWords" 
            type="textarea" 
            :rows="4"
            placeholder="请输入敏感词，用逗号分隔"
          />
        </el-form-item>

        <!-- 审核规则配置 -->
        <el-form-item label="极端低分阈值">
          <el-input-number 
            v-model="settingsForm.extremeLowScoreThreshold" 
            :min="1" 
            :max="5" 
            controls-position="right"
          />
          <span class="form-hint">评分低于此分数将触发人工审核</span>
        </el-form-item>
        
        <el-form-item label="启用人工审核">
          <el-switch v-model="settingsForm.manualReviewEnabled" />
        </el-form-item>

        <!-- 文件存储配置 -->
        <el-form-item label="最大文件大小(MB)">
          <el-input-number 
            v-model="settingsForm.maxFileSize" 
            :min="1" 
            :max="100" 
            controls-position="right"
          />
        </el-form-item>
        
        <el-form-item label="附件有效期(天)">
          <el-input-number 
            v-model="settingsForm.attachmentExpiryDays" 
            :min="1" 
            :max="365" 
            controls-position="right"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
          <el-button @click="fetchSettings">重置</el-button>
        </el-form-item>
      </el-form>
    </PageSection>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

.form-hint {
  margin-left: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}
</style>
