<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo" @click="router.push('/')">
      <span class="logo-text">{{ isCollapsed ? 'DM' : 'DriveMan' }}</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="route.path"
      :router="true"
      :collapse="isCollapsed"
      :collapse-transition="false"
      background-color="#fff"
      text-color="#606266"
      active-text-color="#409eff"
    >
      <template v-for="group in menuGroups" :key="group.title">
        <el-sub-menu :index="group.title" v-if="group.children.length > 0">
          <template #title>
            <el-icon><component :is="resolveIcon(group.icon)" /></el-icon>
            <span>{{ group.title }}</span>
          </template>
          <el-menu-item
            v-for="item in group.children"
            :key="item.route"
            :index="item.route"
          >
            <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>

    <!-- 底部折叠按钮 -->
    <div class="sidebar-footer">
      <el-tooltip :content="isCollapsed ? '展开侧栏' : '收起侧栏'" placement="right">
        <el-button text class="collapse-btn" @click="toggleCollapse">
          <el-icon><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { menuConfig } from '@/config/menu'
import { Fold, Expand } from '@element-plus/icons-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 折叠状态（持久化到 localStorage）
const isCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', isCollapsed.value)
}

// 根据角色获取菜单分组
const menuGroups = computed(() => {
  return menuConfig[userStore.role] || []
})

// 图标解析
function resolveIcon(name) {
  return ElementPlusIcons[name] || ElementPlusIcons.Menu
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.25s ease;
  overflow: hidden;
  flex-shrink: 0;

  &.collapsed {
    width: 64px;
  }
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  white-space: nowrap;
}

/* el-menu 轻量定制 */
:deep(.el-menu) {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 4px;

  /* 隐藏滚动条（webkit） */
  &::-webkit-scrollbar {
    width: 0;
  }
}

:deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  padding-left: 16px !important;

  &:hover {
    background-color: #f0f5ff !important;
  }

  .el-icon {
    font-size: 16px;
    margin-right: 8px;
  }
}

:deep(.el-menu-item) {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  padding-left: 48px !important;
  border-radius: 0 6px 6px 0;
  margin: 1px 8px 1px 0;
  min-width: auto;

  &:hover {
    background-color: #f0f5ff !important;
    color: #409eff;
  }

  &.is-active {
    background-color: #ecf5ff !important;
    color: #409eff;
    font-weight: 500;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: #409eff;
    }
  }

  .el-icon {
    font-size: 15px;
    margin-right: 8px;
  }
}

/* 折叠态调整 */
.collapsed {
  :deep(.el-sub-menu__title) {
    padding-left: 14px !important;
    justify-content: center;

    .el-icon {
      margin-right: 0;
    }
  }

  :deep(.el-menu-item) {
    padding-left: 14px !important;
    justify-content: center;
    margin: 1px 6px;

    .el-icon {
      margin-right: 0;
    }
  }
}

/* 底部折叠按钮 */
.sidebar-footer {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.collapse-btn {
  font-size: 16px;
  color: #909399;
  padding: 8px;

  &:hover {
    color: #409eff;
  }
}
</style>
