<script setup>
defineOptions({ name: 'StaffProfileCard' })

defineProps({
  profile: { type: Object, default: null },
  account: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  schoolName: { type: String, default: '' },
  orgName: { type: String, default: '' },
})

const statusMap = {
  active: { label: '正常', type: 'success' },
  inactive: { label: '已停用', type: 'danger' },
  locked: { label: '已锁定', type: 'warning' },
}

function getStatusInfo(status) {
  return statusMap[status] || { label: status || '未知', type: 'info' }
}
</script>

<template>
  <div class="profile-card">
    <div class="avatar-area">
      <div class="avatar-circle">
        {{ profile?.real_name?.charAt(0) || 'U' }}
      </div>
    </div>
    <h3 class="profile-name">{{ profile?.real_name || '未设置姓名' }}</h3>
    <div class="profile-meta">
      <span class="meta-item">
        <span class="meta-label">工号</span>
        <span class="meta-value">{{ profile?.no_work || '-' }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">学校</span>
        <span class="meta-value">{{ schoolName || '-' }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">所属组织</span>
        <span class="meta-value">{{ orgName || '-' }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">账号状态</span>
        <el-tag :type="getStatusInfo(account?.account_status || account?.status).type" size="small" effect="plain">
          {{ getStatusInfo(account?.account_status || account?.status).label }}
        </el-tag>
      </span>
    </div>
    <div v-if="roles.length" class="role-tags">
      <template v-if="roles.length <= 3">
        <el-tag v-for="role in roles" :key="role.role_code" size="small" effect="plain" class="role-tag">
          {{ role.role_name }}
        </el-tag>
      </template>
      <template v-else>
        <el-tag v-for="role in roles.slice(0, 3)" :key="role.role_code" size="small" effect="plain" class="role-tag">
          {{ role.role_name }}
        </el-tag>
        <el-tooltip placement="top">
          <template #content>
            <span v-for="(role, idx) in roles" :key="role.role_code">
              {{ role.role_name }}<span v-if="idx < roles.length - 1">、</span>
            </span>
          </template>
          <el-tag size="small" effect="plain" class="role-tag role-tag-more">+{{ roles.length - 3 }}</el-tag>
        </el-tooltip>
      </template>
    </div>
    <div v-else class="role-empty">暂无角色，请联系学校管理员</div>
  </div>
</template>

<style scoped>
.profile-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
  padding: var(--space-6, 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.avatar-area { margin-bottom: var(--space-3, 12px); }
.avatar-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--color-primary-50, #e8f5e9);
  color: var(--color-primary, #2d6a2e);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 600;
}
.profile-name {
  font-size: var(--font-lg, 18px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4, 16px);
}
.profile-meta {
  display: flex; flex-direction: column; gap: var(--space-2, 8px);
  width: 100%;
  padding: var(--space-3, 12px) 0;
  border-top: 1px solid var(--color-border-light, #f0f0f0);
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}
.meta-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 var(--space-2, 8px);
}
.meta-label { font-size: var(--font-sm, 13px); color: var(--color-text-secondary); }
.meta-value { font-size: var(--font-sm, 13px); color: var(--color-text-heading); font-weight: 500; }
.role-tags {
  display: flex; flex-wrap: wrap; gap: var(--space-2, 8px);
  justify-content: center;
  margin-top: var(--space-3, 12px);
}
.role-tag { font-size: var(--font-xs, 12px); }
.role-tag-more {
  background: var(--color-primary-50, #e8f5e9);
  border-color: var(--color-primary-50, #c8e6c9);
  color: var(--color-primary, #2d6a2e);
}
.role-empty {
  margin-top: var(--space-3, 12px);
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted);
}
</style>
