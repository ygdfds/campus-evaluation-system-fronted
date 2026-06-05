<script setup>
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-area">
          <el-icon :size="36" color="#409eff"><School /></el-icon>
          <h1 class="system-title">校园服务质量评测系统</h1>
          <p class="system-subtitle">Campus Service Quality Evaluation</p>
        </div>
      </div>
      <div class="auth-body">
        <slot />
      </div>
      <div class="auth-footer">
        <p>&copy; 2026 校园服务质量评测系统 版权所有</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-header {
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  padding: 32px 24px 28px;
  text-align: center;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.system-title {
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
}

.system-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin: 0;
  letter-spacing: 1px;
}

.auth-body {
  padding: 32px 36px;
}

.auth-footer {
  text-align: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.auth-footer p {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>
