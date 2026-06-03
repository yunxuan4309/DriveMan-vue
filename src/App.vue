<template>
  <el-container class="app-container" v-if="showLayout">
    <el-header class="app-header">
      <div class="logo" @click="$router.push('/')">DriveMan</div>

      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        class="nav-menu"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-sub-menu index="/admin" v-if="userStore.role === 3">
          <template #title>管理后台</template>
          <el-menu-item index="/admin/students">学员管理</el-menu-item>
          <el-menu-item index="/admin/coaches">教练管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/about">关于</el-menu-item>
      </el-menu>

      <div class="header-right">
        <template v-if="userStore.isLoggedIn">
          <el-tag :type="roleTagType" size="small">{{ userStore.roleLabel }}</el-tag>
          <span class="user-name">{{ userStore.userInfo.realName || userStore.userInfo.username }}</span>
          <el-button text type="primary" size="small" @click="handleLogout">退出</el-button>
        </template>
        <template v-else>
          <el-button text type="primary" size="small" @click="$router.push('/login')">登录</el-button>
        </template>
      </div>
    </el-header>

    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>

  <!-- 登录页不使用全局布局 -->
  <router-view v-else />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 页面刷新时从 localStorage 恢复登录态
onMounted(() => {
  userStore.restoreSession()
})

const showLayout = computed(() => route.name !== 'Login')

const roleTagType = computed(() => {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[userStore.role] || 'info'
})

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出')
  router.push('/login')
}
</script>

<style lang="scss">
@use '@/styles/global' as *;

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 24px;

  .logo {
    font-size: 22px;
    font-weight: 700;
    color: $primary-color;
    margin-right: 40px;
    white-space: nowrap;
    cursor: pointer;
  }

  .nav-menu {
    flex: 1;
    border-bottom: none;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;

    .user-name {
      font-size: 14px;
      color: #333;
    }
  }
}

.app-main {
  background: #f5f7fa;
  min-height: calc(100vh - $header-height);
}
</style>
