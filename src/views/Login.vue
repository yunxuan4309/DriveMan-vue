<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <h2>DriveMan</h2>
        <p>驾校报名管理系统</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
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
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>

        <div class="role-hint">
          <span v-for="r in roles" :key="r.value">
            <el-tag :type="r.tag" size="small">{{ r.label }}</el-tag>
          </span>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const roles = [
  { label: '管理员 admin / admin123', value: 3, tag: 'danger' },
  { label: '教练', value: 2, tag: 'warning' },
  { label: '学员', value: 1, tag: 'success' },
]

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login({
        username: form.username,
        password: form.password,
      })
      ElMessage.success('登录成功')
      router.push('/')
    } catch (err) {
      // 错误已由响应拦截器统一处理
    } finally {
      loading.value = false
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
  width: 420px;
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 40px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

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
