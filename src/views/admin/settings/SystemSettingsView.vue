<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'AdminSystemSettingsView' })

// 配置表单
const settingsForm = ref({
  // 短信模板
  onboardingNotificationTemplate: '',
  expirationWarningTemplate: '',
  
  // 敏感词库
  sensitiveWords: '',
  
  // 审核规则
  extremeLowScoreThreshold: 2,
  manualReviewEnabled: true,
  
  // 文件存储配置
  maxFileSize: 10, // MB
  attachmentExpiryDays: 30
})

onMounted(() => {
  // TODO: 获取当前系统配置
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="系统全局配置" 
      subtitle="平台基础配置与业务规则设置" 
    />
    
    <el-card shadow="hover" class="section-card">
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
          <el-button type="primary">保存配置</el-button>
          <el-button>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

.section-card { 
  border-radius: var(--radius-lg); 
}

.form-hint {
  margin-left: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}
</style>