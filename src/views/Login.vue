<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <h2>DriveMan</h2>
        <p>驾校报名管理系统</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 登录标签页 -->
        <el-tab-pane label="登录" name="login">
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loginLoading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 学员注册标签页 -->
        <el-tab-pane label="学员注册" name="register">
          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="0">
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="用户名" :prefix-icon="User" size="large" />
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" size="large" show-password />
            </el-form-item>

            <el-form-item prop="realName">
              <el-input v-model="registerForm.realName" placeholder="真实姓名" :prefix-icon="User" size="large" />
            </el-form-item>

            <el-form-item prop="phone">
              <el-input v-model="registerForm.phone" placeholder="手机号" :prefix-icon="Phone" size="large" />
            </el-form-item>

            <el-form-item prop="idCard">
              <el-input v-model="registerForm.idCard" placeholder="身份证号" :prefix-icon="Document" size="large" />
            </el-form-item>

            <el-form-item prop="address">
              <el-input v-model="registerForm.address" placeholder="通讯地址（选填）" :prefix-icon="Location" size="large" />
            </el-form-item>

            <el-button
              type="success"
              size="large"
              class="login-btn"
              :loading="registerLoading"
              @click="handleRegister"
            >
              注 册
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 教练注册标签页 -->
        <el-tab-pane label="教练注册" name="coachRegister">
          <el-form ref="coachRegFormRef" :model="coachRegForm" :rules="coachRegRules" label-width="0">
            <el-form-item prop="username">
              <el-input v-model="coachRegForm.username" placeholder="用户名" :prefix-icon="User" size="large" />
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="coachRegForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input v-model="coachRegForm.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" size="large" show-password />
            </el-form-item>

            <el-form-item prop="realName">
              <el-input v-model="coachRegForm.realName" placeholder="真实姓名" :prefix-icon="User" size="large" />
            </el-form-item>

            <el-form-item prop="phone">
              <el-input v-model="coachRegForm.phone" placeholder="手机号" :prefix-icon="Phone" size="large" />
            </el-form-item>

            <el-form-item prop="idCard">
              <el-input v-model="coachRegForm.idCard" placeholder="身份证号" :prefix-icon="Document" size="large" />
            </el-form-item>

            <el-form-item prop="vehicleType">
              <el-select v-model="coachRegForm.vehicleType" placeholder="准教车型（可多选）" size="large" multiple style="width:100%">
                <el-option label="C1（手动挡小汽车）" value="C1" />
                <el-option label="C2（自动挡小汽车）" value="C2" />
                <el-option label="C5（残疾人专用）" value="C5" />
                <el-option label="B1（中型客车）" value="B1" />
                <el-option label="B2（大型货车）" value="B2" />
                <el-option label="A1（大型客车）" value="A1" />
                <el-option label="A2（牵引车）" value="A2" />
                <el-option label="A3（城市公交车）" value="A3" />
                <el-option label="N1（小型新能源教练车）" value="N1" />
                <el-option label="N2（中型新能源教练车）" value="N2" />
                <el-option label="N3（大型新能源教练车）" value="N3" />
              </el-select>
            </el-form-item>

            <el-form-item prop="coachYears">
              <el-input-number v-model="coachRegForm.coachYears" :min="0" :max="50" placeholder="执教年限（选填）" size="large" style="width:100%" />
            </el-form-item>

            <el-button
              type="warning"
              size="large"
              class="login-btn"
              :loading="coachRegLoading"
              @click="handleCoachRegister"
            >
              教练注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="role-hint">
        <span v-for="r in roles" :key="r.value">
          <el-tag :type="r.tag" size="small">{{ r.label }}</el-tag>
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Document, Location } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loginFormRef = ref(null)
const registerFormRef = ref(null)
const loginLoading = ref(false)
const registerLoading = ref(false)

const roles = [
  { label: '管理员 admin / admin123', value: 3, tag: 'danger' },
  { label: '教练', value: 2, tag: 'warning' },
  { label: '学员', value: 1, tag: 'success' },
]

// ── 登录 ────────────────────────────────────────────
const loginForm = reactive({
  username: '',
  password: '',
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loginLoading.value = true
    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password,
      })
      ElMessage.success(`欢迎，${userStore.roleLabel || '准学员'}`)

      // role=0 准学员 → 跳转驾考报名页
      if (userStore.role === 0) {
        router.push('/student/enrollment')
      } else {
        router.push('/')
      }
    } catch {
      // 错误已由响应拦截器统一处理
    } finally {
      loginLoading.value = false
    }
  })
}

// ── 注册 ────────────────────────────────────────────
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  idCard: '',
  address: '',
})

const validateConfirmPassword = (_rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePhone = (_rule, value, callback) => {
  if (!value) return callback()
  if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

const validateIdCard = (_rule, value, callback) => {
  if (!value) return callback()
  if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
    callback(new Error('身份证号格式不正确'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { validator: validateIdCard, trigger: 'blur' },
  ],
}

async function handleRegister() {
  registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    registerLoading.value = true
    try {
      await request.post('/register', {
        username: registerForm.username,
        password: registerForm.password,
        realName: registerForm.realName,
        phone: registerForm.phone,
        idCard: registerForm.idCard,
        address: registerForm.address || null,
      })
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      registerFormRef.value.resetFields()
    } catch {
      // 错误已由响应拦截器统一处理
    } finally {
      registerLoading.value = false
    }
  })
}

// ── 教练注册 ──────────────────────────────────────────
const coachRegFormRef = ref(null)
const coachRegLoading = ref(false)

const coachRegForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  idCard: '',
  vehicleType: [],
  coachYears: null,
})

const validateCoachConfirmPassword = (_rule, value, callback) => {
  if (value !== coachRegForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const coachRegRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateCoachConfirmPassword, trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { validator: validateIdCard, trigger: 'blur' },
  ],
  vehicleType: [
    { required: true, message: '请选择至少一个准教车型', trigger: 'change' },
    { type: 'array', min: 1, message: '请选择至少一个准教车型', trigger: 'change' },
  ],
}

async function handleCoachRegister() {
  coachRegFormRef.value.validate(async (valid) => {
    if (!valid) return

    const vehicleType = coachRegForm.vehicleType.join(',')
    if (!vehicleType) {
      ElMessage.error('请选择准教车型')
      return
    }

    coachRegLoading.value = true
    try {
      await request.post('/coach/register', {
        username: coachRegForm.username,
        password: coachRegForm.password,
        realName: coachRegForm.realName,
        phone: coachRegForm.phone,
        idCard: coachRegForm.idCard,
        vehicleType,
        coachYears: coachRegForm.coachYears || null,
      })
      ElMessage.success('教练注册申请已提交，请等待管理员审核')
      activeTab.value = 'login'
      coachRegFormRef.value.resetFields()
    } catch {
      // 错误已由响应拦截器统一处理
    } finally {
      coachRegLoading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 440px;
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 32px 40px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 20px;

  h2 {
    font-size: 28px;
    color: $primary-color;
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: #999;
  }
}

.login-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.role-hint {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
