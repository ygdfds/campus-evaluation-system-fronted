<script setup>
defineOptions({ name: 'StaffPermissionPanel' })

defineProps({
  roles: { type: Array, default: () => [] },
  permissionTexts: { type: Array, default: () => [] },
})

// 权限卡片配置
const permissionCards = [
  { key: '数据看板', icon: '📊', title: '数据看板', desc: '可查看授权范围内评价结果和反馈数据' },
  { key: '学院事务', icon: '🏫', title: '学院事务', desc: '可管理所属学院教学相关事务' },
  { key: '表单发布', icon: '📋', title: '表单发布', desc: '可创建并提交教学评价表单' },
  { key: '后勤服务', icon: '🔧', title: '后勤服务', desc: '可处理后勤服务部门相关反馈' },
  { key: '申诉处理', icon: '⚖️', title: '申诉处理', desc: '可处理授权范围内评价申诉' },
]

function matchPermissionCard(text) {
  for (const card of permissionCards) {
    if (text.includes(card.key)) return card
  }
  return { key: text, icon: '✅', title: text, desc: text }
}
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h3 class="panel-title">角色授权</h3>
    </div>

    <div class="perm-section">
      <h4 class="section-label">当前角色</h4>
      <div v-if="roles.length" class="role-list">
        <el-tag v-for="role in roles" :key="role.role_code" effect="plain" class="role-tag">
          {{ role.role_name }}
        </el-tag>
      </div>
      <div v-else class="empty-text">暂无角色，请联系学校管理员</div>
    </div>

    <div class="perm-section">
      <h4 class="section-label">权限范围</h4>
      <div v-if="permissionTexts.length" class="perm-grid">
        <div v-for="(text, idx) in permissionTexts" :key="idx" class="perm-card">
          <div class="perm-card-icon">{{ matchPermissionCard(text).icon }}</div>
          <div class="perm-card-content">
            <div class="perm-card-title">{{ matchPermissionCard(text).title }}</div>
            <div class="perm-card-desc">{{ matchPermissionCard(text).desc }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-text">暂无授权范围</div>
    </div>

    <div class="perm-notes">
      <div class="perm-note-item">
        <span class="note-dot" />
        角色与授权范围由学校管理员配置，如需调整请联系管理员
      </div>
      <div class="perm-note-item">
        <span class="note-dot" />
        授权范围只读，当前权限仅作用于本校数据
      </div>
      <div class="perm-note-item">
        <span class="note-dot" />
        角色变更由学校管理员配置，职工本人无法自行修改
      </div>
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
.perm-section { margin-bottom: var(--space-5, 20px); }
.section-label { font-size: var(--font-sm, 13px); color: var(--color-text-secondary); font-weight: 500; margin: 0 0 var(--space-3, 12px); }
.role-list { display: flex; flex-wrap: wrap; gap: var(--space-2, 8px); }
.role-tag { font-size: var(--font-sm, 13px); }
.perm-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3, 12px);
}
.perm-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-bg-page, #f7f8fa);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border-lighter, #f0f0f0);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.perm-card:hover {
  border-color: var(--color-primary-50, #c8e6c9);
  box-shadow: 0 2px 4px rgba(45, 106, 46, 0.06);
}
.perm-card-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm, 6px);
}
.perm-card-content { flex: 1; min-width: 0; }
.perm-card-title { font-size: var(--font-sm, 13px); font-weight: 600; color: var(--color-text-heading); margin-bottom: 2px; }
.perm-card-desc { font-size: var(--font-xs, 12px); color: var(--color-text-muted); line-height: 1.4; }
.empty-text { font-size: var(--font-sm, 13px); color: var(--color-text-muted); }
.perm-notes {
  margin-top: var(--space-4, 16px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-primary-50, #e8f5e9);
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}
.perm-note-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 8px);
  font-size: var(--font-xs, 12px);
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.note-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary, #2d6a2e);
  flex-shrink: 0;
  margin-top: 5px;
}
@media (max-width: 768px) {
  .perm-grid { grid-template-columns: 1fr; }
}
</style>
