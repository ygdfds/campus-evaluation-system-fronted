<script setup>
import { Lock, Cellphone, Message as MsgIcon, Timer } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffSecurityPanel' })

defineProps({
  account: { type: Object, default: null },
})

const emit = defineEmits(['changePassword'])

function formatDateTime(dt) {
  if (!dt) return ''
  return dt.replace('T', ' ').slice(0, 16)
}

function getPasswordStrength() {
  // mock 环境简化
  return { label: '中等', type: 'warning', percent: 50 }
}

const pwdStrength = getPasswordStrength()
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h3 class="panel-title">账号安全</h3>
    </div>

    <div class="security-list">
      <!-- 手机号 -->
      <div class="security-item">
        <div class="security-icon-wrap">
          <el-icon :size="18" class="security-icon"><Cellphone /></el-icon>
        </div>
        <div class="security-info">
          <div class="security-label">手机号</div>
          <div class="security-desc">
            {{ account?.phone ? '已绑定 ' + account.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定手机号' }}
          </div>
        </div>
        <el-tag v-if="account?.phone" type="success" size="small" effect="plain">已绑定</el-tag>
        <el-tag v-else type="info" size="small" effect="plain">未绑定</el-tag>
      </div>

      <!-- 邮箱 -->
      <div class="security-item">
        <div class="security-icon-wrap">
          <el-icon :size="18" class="security-icon"><MsgIcon /></el-icon>
        </div>
        <div class="security-info">
          <div class="security-label">邮箱</div>
          <div class="security-desc">
            {{ account?.email ? '已绑定 ' + account.email.replace(/(.{2}).+(@.+)/, '$1***$2') : '未绑定邮箱' }}
          </div>
        </div>
        <el-tag v-if="account?.email" type="success" size="small" effect="plain">已绑定</el-tag>
        <el-tag v-else type="info" size="small" effect="plain">未绑定</el-tag>
      </div>

      <!-- 登录密码 -->
      <div class="security-item">
        <div class="security-icon-wrap">
          <el-icon :size="18" class="security-icon"><Lock /></el-icon>
        </div>
        <div class="security-info">
          <div class="security-label">登录密码</div>
          <div class="security-desc">
            密码强度：<el-tag :type="pwdStrength.type" size="small" effect="plain">{{ pwdStrength.label }}</el-tag>
          </div>
        </div>
        <el-button size="small" class="btn-green-outline" @click="emit('changePassword')">修改密码</el-button>
      </div>

      <!-- 最近登录 -->
      <div class="security-item last">
        <div class="security-icon-wrap">
          <el-icon :size="18" class="security-icon"><Timer /></el-icon>
        </div>
        <div class="security-info">
          <div class="security-label">最近登录</div>
          <div class="security-desc">
            {{ formatDateTime(account?.last_login_at) || '暂无登录记录' }}
          </div>
        </div>
      </div>
    </div>

    <div class="security-tips">
      <div class="tips-title">安全建议</div>
      <ul class="tips-list">
        <li>建议定期修改登录密码</li>
        <li>请确保手机号和邮箱可用，以便接收重要通知</li>
        <li>如发现异常登录，请及时联系学校管理员</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.panel-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
  padding: var(--space-5, 20px) var(--space-6, 24px);
  min-height: 420px;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--space-4, 16px);
  padding-bottom: var(--space-3, 12px);
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}
.panel-title { font-size: var(--font-md, 15px); font-weight: 600; color: var(--color-text-heading); margin: 0; }
.security-list { display: flex; flex-direction: column; }
.security-item {
  display: flex; align-items: center; gap: var(--space-3, 12px);
  padding: var(--space-4, 16px) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f5f5f5);
}
.security-item.last { border-bottom: none; }
.security-icon-wrap {
  width: 36px; height: 36px;
  border-radius: var(--radius-md, 8px);
  background: var(--color-primary-50, #e8f5e9);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.security-icon { color: var(--color-primary, #2d6a2e); }
.security-info { flex: 1; min-width: 0; }
.security-label { font-size: var(--font-sm, 13px); color: var(--color-text-heading); font-weight: 500; margin-bottom: 2px; }
.security-desc { font-size: var(--font-xs, 12px); color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; }
.btn-green-outline {
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-text-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-50, #e8f5e9);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-text-color: var(--color-primary-hover, #3d8a3e);
  flex-shrink: 0;
}
.security-tips {
  margin-top: var(--space-5, 20px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-bg-page, #f7f8fa);
  border-radius: var(--radius-md, 8px);
}
.tips-title {
  font-size: var(--font-xs, 12px);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2, 8px);
}
.tips-list {
  margin: 0;
  padding-left: var(--space-4, 16px);
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted);
  line-height: 1.8;
}
</style>
