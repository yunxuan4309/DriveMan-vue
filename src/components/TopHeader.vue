<template>
  <div class="top-header">
    <!-- 左侧：面包屑 -->
    <div class="header-left">
      <el-breadcrumb separator="›">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="groupName">{{ groupName }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="pageName">{{ pageName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧：用户信息 -->
    <div class="header-right">
      <el-tag :type="roleTagType" size="small" effect="light">
        {{ userStore.roleLabel }}
      </el-tag>
      <span class="user-name">
        {{ userStore.userInfo.realName || userStore.userInfo.username }}
      </span>
      <el-dropdown trigger="click" @command="handleCommand">
        <el-avatar :size="30" :icon="UserFilled" class="user-avatar" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人信息
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled, User, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getBreadcrumb } from '@/config/menu'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 从菜单配置中查找面包屑路径
const breadcrumb = computed(() => getBreadcrumb(route.path, userStore.role))
const groupName = computed(() => breadcrumb.value[0])
const pageName = computed(() => breadcrumb.value[1])

const roleTagType = computed(() => {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[userStore.role] || 'info'
})

function handleCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出')
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.top-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 面包屑定制 */
:deep(.el-breadcrumb) {
  font-size: 14px;

  .el-breadcrumb__inner {
    color: #909399;
    font-weight: 400;

    &.is-link {
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }

  .el-breadcrumb__separator {
    color: #c0c4cc;
    font-weight: 300;
  }

  .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: #303133;
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-size: 13px;
  color: #606266;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar {
  cursor: pointer;
  background: #ecf5ff;
  color: #409eff;
  flex-shrink: 0;
}
</style>
