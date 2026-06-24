import { ref } from 'vue'

// 共享响应式状态：用于登录页测试账号点击填充
// 父组件(AuthLayout)写入，子组件(LoginForm)监听并填充表单
export const testAccountTrigger = ref(0)
export const testAccountData = ref({ username: '', password: '' })
