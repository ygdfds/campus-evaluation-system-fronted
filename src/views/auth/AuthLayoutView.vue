<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { inject } from 'vue'

const route = useRoute()

// 注入子组件提供的测试账号填充方法
const fillTestAccount = inject('fillTestAccount', () => {})

// 根据路由动态设置辅色（覆盖 Element Plus CSS 变量，子组件自动跟随）
const authAccentStyle = computed(() => {
  const path = route.path
  let prefix = 'user'
  if (path === '/login/sys') prefix = 'sys'
  else if (path === '/login/school') prefix = 'school'

  return {
    '--color-accent-50': `var(--color-accent-${prefix}-50)`,
    '--color-accent-100': `var(--color-accent-${prefix}-100)`,
    '--color-accent-200': `var(--color-accent-${prefix}-200)`,
    '--color-accent-300': `var(--color-accent-${prefix}-300)`,
    '--color-accent-400': `var(--color-accent-${prefix}-400)`,
    '--color-accent-500': `var(--color-accent-${prefix}-500)`,
    '--color-accent-600': `var(--color-accent-${prefix}-600)`,
    '--color-accent-700': `var(--color-accent-${prefix}-700)`,
    // 覆盖 Element Plus 主题色，使 el-link / el-checkbox 等自动跟随辅色
    '--el-color-primary': `var(--color-accent-${prefix}-500)`,
    '--el-color-primary-light-3': `var(--color-accent-${prefix}-400)`,
    '--el-color-primary-light-5': `var(--color-accent-${prefix}-300)`,
    '--el-color-primary-light-7': `var(--color-accent-${prefix}-200)`,
    '--el-color-primary-light-8': `var(--color-accent-${prefix}-100)`,
    '--el-color-primary-light-9': `var(--color-accent-${prefix}-50)`,
    '--el-color-primary-dark-2': `var(--color-accent-${prefix}-600)`,
  }
})

// 根据路由动态显示测试账号
const testAccounts = computed(() => {
  const path = route.path
  if (path === '/login/school') {
    return [
      { label: '清华校管', username: 'school_admin', password: '123456' },
      { label: '北大校管', username: 'pku_admin', password: '123456' },
    ]
  }
  if (path === '/login/sys') {
    // 系统管理员登录页不显示测试账号区
    return []
  }
  // 默认（/login）：用户登录
  return [
    { label: '清华教师', username: 'teacher_li', password: '123456' },
    { label: '清华学生', username: 'student_zhang', password: '123456' },
    { label: '北大教师', username: 'pku_teacher', password: '123456' },
    { label: '北大学生', username: 'pku_student', password: '123456' },
  ]
})

// 根据路由动态显示品牌能力点
const brandSlogans = computed(() => {
  const path = route.path
  if (path === '/login/sys') {
    return [
      { title: '租户入驻审核', desc: '学校入驻申请审批与资质审核' },
      { title: '平台运行监控', desc: '全平台数据监控与异常预警' },
      { title: '套餐与权限管理', desc: '服务套餐配置与角色权限分配' },
    ]
  }
  if (path === '/login/school') {
    return [
      { title: '全校数据监督', desc: '覆盖全校各院系评价数据统计' },
      { title: '组织与用户管理', desc: '院系部门管理与师生账号维护' },
      { title: '评价工单闭环', desc: '评价收集 → 问题归类 → 整改反馈' },
    ]
  }
  // 默认（/login）：用户登录
  return [
    { title: '教学服务评价', desc: '食堂、宿舍、图书馆等校园服务评价' },
    { title: '反馈投诉跟踪', desc: '提交建议与投诉，实时跟踪处理进度' },
    { title: '个人评价历史', desc: '查看历史评价记录与统计反馈' },
  ]
})
</script>

<template>
  <div class="auth-page" :style="authAccentStyle">
    <div class="bg-decoration">
      <div class="bg-circle circle-1" />
      <div class="bg-circle circle-2" />
      <div class="bg-circle circle-3" />
      <div class="bg-circle circle-4" />
    </div>

    <div class="auth-wrapper">
      <!-- 左侧品牌区域（持久化，不随路由切换销毁） -->
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">评</div>
          </div>
          <h1 class="brand-title">校园服务质量在线评测系统</h1>
          <p class="brand-subtitle">Campus Service Quality Evaluation System</p>

          <div class="brand-divider" />

          <div class="brand-slogans">
            <div v-for="(slogan, idx) in brandSlogans" :key="idx" class="slogan-item">
              <div class="slogan-text">
                <strong>{{ slogan.title }}</strong>
                <span>{{ slogan.desc }}</span>
              </div>
            </div>
          </div>

          <div class="brand-footer-text">
            共建美好校园，从每一次评价开始
          </div>
        </div>
      </div>

      <!-- 右侧表单区域（由子路由渲染，外壳不销毁） -->
      <div class="auth-form-area">
        <RouterView />
      </div>
    </div>

    <!-- 测试账号 -->
    <div v-if="testAccounts.length" class="test-accounts">
      <p class="test-title">测试账号（点击快速填充）</p>
      <div class="test-list">
        <el-tag
          v-for="acc in testAccounts"
          :key="acc.username"
          size="small"
          effect="plain"
          @click="fillTestAccount(acc.username, acc.password)"
        >
          {{ acc.label }}: {{ acc.username }} / {{ acc.password }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  /* 辅色极浅底作为全局背景，跟随三端变化 */
  background: linear-gradient(135deg, var(--color-accent-50) 0%, var(--color-bg-subtle) 50%, var(--color-accent-50) 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  /* 统一使用主色浅绿作为装饰圆，不跟随辅色变化 */
  background: var(--color-primary-100);
  opacity: 0.4;
}

.circle-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  left: -150px;
}

.circle-2 {
  width: 350px;
  height: 350px;
  top: 80px;
  right: -100px;
}

.circle-3 {
  width: 400px;
  height: 400px;
  bottom: -120px;
  right: 15%;
}

.circle-4 {
  width: 250px;
  height: 250px;
  bottom: 60px;
  left: 5%;
}

/* 主体布局 - 左右等宽对称 */
.auth-wrapper {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* 左侧品牌区域 */
.auth-brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-16) var(--space-10);
  min-width: 0;
}

.brand-content {
  max-width: 460px;
}

.brand-logo {
  margin-bottom: var(--space-6);
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary-500);
  color: var(--color-text-white);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-button);
}

.brand-title {
  font-size: var(--font-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-tight);
}

.brand-subtitle {
  font-size: var(--font-base);
  color: var(--color-text-placeholder);
  margin: 0 0 var(--space-8);
  letter-spacing: var(--letter-spacing-wide);
}

.brand-divider {
  width: 48px;
  height: 3px;
  background: var(--color-primary-500);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-8);
}

.brand-slogans {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-10);
}

.slogan-item {
  display: flex;
  align-items: flex-start;
}

.slogan-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.slogan-text strong {
  font-size: var(--font-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.slogan-text span {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.brand-footer-text {
  font-size: var(--font-base);
  /* 主色绿色，保持品牌一致性 */
  color: var(--color-primary-500);
  font-style: italic;
  opacity: 0.85;
}

/* 右侧表单区域 */
.auth-form-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-16) var(--space-10);
}

.test-accounts {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  text-align: center;
  max-width: 600px;
}

.test-title {
  font-size: var(--font-xs);
  color: var(--color-text-disabled);
  margin: 0 0 var(--space-3);
}

.test-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

.test-list .el-tag {
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all 0.2s;
}

.test-list .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 响应式 */
@media (max-width: 900px) {
  .auth-wrapper {
    flex-direction: column;
  }

  .auth-brand {
    justify-content: center;
    padding: var(--space-10) var(--space-8) var(--space-5);
  }

  .brand-content {
    max-width: 100%;
  }

  .brand-title {
    font-size: var(--font-3xl);
  }

  .brand-slogans {
    display: none;
  }

  .brand-footer-text {
    text-align: center;
  }

  .auth-form-area {
    align-items: center;
    padding: var(--space-5) var(--space-5) var(--space-10);
  }
}
</style>
