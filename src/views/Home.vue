<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <el-card shadow="never" class="welcome-card">
      <div class="welcome-content">
        <el-avatar :size="56" :icon="UserFilled" style="cursor: pointer; background: #ecf5ff; color: #409eff" @click="$router.push('/profile')" />
        <div>
          <h2>欢迎回来，{{ userStore.userInfo.realName || userStore.userInfo.username }}</h2>
          <p class="user-info">
            <el-tag :type="roleTagType" size="small" effect="light">{{ userStore.roleLabel }}</el-tag>
            <span class="sep">|</span>
            ID: {{ userStore.userId }}
            <template v-if="userStore.licenseType">
              <span class="sep">|</span>
              车型: {{ userStore.licenseType }}
            </template>
          </p>
        </div>
      </div>
    </el-card>

    <!-- 快捷入口卡片 -->
    <el-card shadow="never" class="quick-card">
      <template #header>
        <span class="card-title">快捷入口</span>
      </template>
      <div class="quick-grid">
        <div
          v-for="item in quickItems"
          :key="item.label"
          class="quick-item"
          @click="router.push(item.route)"
        >
          <el-button :type="item.type || 'primary'" class="quick-btn">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </el-button>
          <span class="quick-label">{{ item.label }}</span>
        </div>
      </div>
    </el-card>

    <!-- 使用提示 -->
    <el-card shadow="never" class="tip-card">
      <div class="tip-content">
        <el-icon :size="18" color="#909399"><InfoFilled /></el-icon>
        <span>使用左侧菜单导航到各功能模块</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { UserFilled, Calendar, Edit, FolderOpened, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { menuConfig } from '@/config/menu'

const router = useRouter()
const userStore = useUserStore()

const roleTagType = computed(() => {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[userStore.role] || 'info'
})

// 快捷入口：取每个分组的第一个子项
const quickItems = computed(() => {
  const groups = menuConfig[userStore.role] || []
  return groups.slice(0, 4).map(g => ({
    label: g.children[0]?.title || g.title,
    icon: g.children[0]?.icon || g.icon,
    type: ['primary', 'success', 'warning', 'info'][groups.indexOf(g)],
    route: g.children[0]?.route || '/',
  }))
})
</script>

<style scoped lang="scss">
.home {
  max-width: 860px;
  margin: 32px auto;
  padding: 0 24px;
}

.welcome-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 28px 32px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 18px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 6px;
    color: #303133;
  }

  .user-info {
    margin: 0;
    font-size: 13px;
    color: #909399;
    display: flex;
    align-items: center;
  }

  .sep {
    margin: 0 8px;
    color: #dcdfe6;
  }
}

.quick-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-title {
  font-weight: 600;
  font-size: 14px;
}

.quick-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
}

.quick-btn {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.tip-card {
  :deep(.el-card__body) {
    padding: 14px 20px;
  }
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}
</style>
