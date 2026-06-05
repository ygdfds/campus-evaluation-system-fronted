/**
 * 静态模拟数据 - 用户数据
 * 后端开发完成后，此文件夹可整体删除，替换为后端API调用
 */

// 模拟用户数据库
const mockUsers = [
  {
    id: 1,
    username: 'student',
    password: '123456',
    realName: '张同学',
    role: 'user',
    roleName: '普通用户',
    email: 'student@campus.edu.cn',
    phone: '13800000001',
    studentNo: '2024001',
    department: '计算机科学与技术学院',
    status: 1,
  },
  {
    id: 2,
    username: 'teacher',
    password: '123456',
    realName: '李老师',
    role: 'user',
    roleName: '普通用户',
    email: 'teacher@campus.edu.cn',
    phone: '13800000002',
    workNo: 'T2020001',
    department: '信息工程学院',
    status: 1,
  },
  {
    id: 3,
    username: 'dept_admin',
    password: '123456',
    realName: '王管理员',
    role: 'dept_admin',
    roleName: '部门管理员',
    email: 'dept@campus.edu.cn',
    phone: '13800000003',
    department: '后勤管理处',
    status: 1,
  },
  {
    id: 4,
    username: 'school_admin',
    password: '123456',
    realName: '赵主任',
    role: 'school_admin',
    roleName: '学校管理人员',
    email: 'school@campus.edu.cn',
    phone: '13800000004',
    department: '校办公室',
    status: 1,
  },
  {
    id: 5,
    username: 'admin',
    password: 'admin123',
    realName: '系统管理员',
    role: 'system_admin',
    roleName: '系统管理员',
    email: 'admin@campus.edu.cn',
    phone: '13800000000',
    department: '信息中心',
    status: 1,
  },
]

// 模拟登录接口
export function mockLogin(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      )
      if (user) {
        // 模拟生成 token
        const token = 'mock_token_' + user.id + '_' + Date.now()
        const userInfo = { ...user }
        delete userInfo.password
        resolve({
          code: 200,
          message: '登录成功',
          data: {
            token,
            userInfo,
          },
        })
      } else {
        reject({
          code: 401,
          message: '用户名或密码错误',
        })
      }
    }, 500)
  })
}

// 模拟注册接口
export function mockRegister(userData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = mockUsers.find((u) => u.username === userData.username)
      if (exists) {
        reject({
          code: 400,
          message: '用户名已存在',
        })
      } else {
        const newUser = {
          id: mockUsers.length + 1,
          ...userData,
          role: 'user',
          roleName: '普通用户',
          status: 1,
        }
        mockUsers.push(newUser)
        const userInfo = { ...newUser }
        delete userInfo.password
        resolve({
          code: 200,
          message: '注册成功',
          data: { userInfo },
        })
      }
    }, 500)
  })
}

export default mockUsers
