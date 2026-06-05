<script setup>
import { RouterView } from 'vue-router'
import { inject } from 'vue'

// 注入子组件提供的测试账号填充方法
const fillTestAccount = inject('fillTestAccount', () => {})
</script>

<template>
  <div class="auth-page">
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
            <div class="slogan-item">
              <div class="slogan-text">
                <strong>多维评价体系</strong>
                <span>覆盖食堂、宿舍、图书馆等八大校园服务</span>
              </div>
            </div>
            <div class="slogan-item">
              <div class="slogan-text">
                <strong>闭环改进机制</strong>
                <span>评价收集 → 问题归类 → 整改处理 → 结果反馈</span>
              </div>
            </div>
            <div class="slogan-item">
              <div class="slogan-text">
                <strong>数据驱动决策</strong>
                <span>智能统计分析，助力校园服务质量持续提升</span>
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
    <div class="test-accounts">
      <p class="test-title">测试账号（点击快速填充）</p>
      <div class="test-list">
        <el-tag size="small" effect="plain" @click="fillTestAccount('student', '123456')">
          学生: student / 123456
        </el-tag>
        <el-tag size="small" effect="plain" @click="fillTestAccount('teacher', '123456')">
          教师: teacher / 123456
        </el-tag>
        <el-tag size="small" effect="plain" @click="fillTestAccount('dept_admin', '123456')">
          部门: dept_admin / 123456
        </el-tag>
        <el-tag size="small" effect="plain" @click="fillTestAccount('admin', 'admin123')">
          管理: admin / admin123
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f0f5f0;
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
  background: rgba(45, 106, 46, 0.035);
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
  padding: 60px 40px;
  min-width: 0;
}

.brand-content {
  max-width: 460px;
}

.brand-logo {
  margin-bottom: 24px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: #2d6a2e;
  color: #fff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(45, 106, 46, 0.3);
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
  line-height: 1.3;
}

.brand-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px;
  letter-spacing: 1px;
}

.brand-divider {
  width: 48px;
  height: 3px;
  background: #2d6a2e;
  border-radius: 2px;
  margin-bottom: 32px;
}

.brand-slogans {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 36px;
}

.slogan-item {
  display: flex;
  align-items: flex-start;
}

.slogan-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slogan-text strong {
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 600;
}

.slogan-text span {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}

.brand-footer-text {
  font-size: 14px;
  color: #2d6a2e;
  font-style: italic;
  opacity: 0.8;
}

/* 右侧表单区域 */
.auth-form-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 40px;
}

.test-accounts {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  text-align: center;
}

.test-title {
  font-size: 12px;
  color: #aaa;
  margin: 0 0 10px;
}

.test-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.test-list .el-tag {
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-list .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式 */
@media (max-width: 900px) {
  .auth-wrapper {
    flex-direction: column;
  }

  .auth-brand {
    justify-content: center;
    padding: 40px 32px 20px;
  }

  .brand-content {
    max-width: 100%;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-slogans {
    display: none;
  }

  .brand-footer-text {
    text-align: center;
  }

  .auth-form-area {
    align-items: center;
    padding: 20px 20px 40px;
  }
}
</style>
