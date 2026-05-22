<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <el-card shadow="never" class="welcome-card">
      <div class="welcome-content">
        <el-avatar :size="56" :icon="UserFilled" />
        <div>
          <h2>欢迎，{{ userStore.roleLabel }}</h2>
          <p class="user-info">
            {{ userStore.userInfo.realName || userStore.userInfo.username }}
            <el-divider direction="vertical" />
            ID: {{ userStore.userId }}
          </p>
        </div>
      </div>
    </el-card>

    <!-- 功能按钮区 -->
    <el-card shadow="never" class="functions-card">
      <template #header>
        <span style="font-weight: 600; font-size: 16px">功能菜单</span>
      </template>
      <div class="functions-grid">
        <div
          v-for="item in menuItems"
          :key="item.label"
          class="function-item"
          @click="handleClick(item)"
        >
          <el-button :type="item.type || 'primary'" class="function-btn">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
            <span class="btn-label">{{ item.label }}</span>
          </el-button>
          <p class="btn-desc">{{ item.desc }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  UserFilled,
  Calendar,
  Edit,
  Document,
  User,
  Trophy,
  Setting,
  Files,
  FolderOpened,
  School,
  Avatar,
  DataAnalysis,
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const menuMap = {
  1: [
    { label: '约课管理', desc: '预约或取消课程', icon: Calendar, type: 'primary' },
    { label: '考试报名', desc: '报名考试场次', icon: Edit, type: 'success' },
    { label: '教练申请', desc: '选择并申请教练', icon: User, type: 'warning' },
    { label: '文件管理', desc: '上传与查看文件', icon: FolderOpened, type: 'info' },
    { label: '我的成绩', desc: '查看考试成绩', icon: Trophy, type: 'danger' },
  ],
  2: [
    { label: '我的课程', desc: '查看课程安排', icon: Calendar, type: 'primary' },
    { label: '学员管理', desc: '查看绑定的学员', icon: School, type: 'success' },
    { label: '考试管理', desc: '管理考试相关', icon: Edit, type: 'warning' },
  ],
  3: [
    { label: '用户管理', desc: '管理所有用户', icon: Avatar, type: 'primary' },
    { label: '教练管理', desc: '管理教练信息', icon: User, type: 'success' },
    { label: '报名审核', desc: '审核学员报名', icon: Edit, type: 'warning' },
    { label: '约课管理', desc: '查看所有约课', icon: Calendar, type: 'info' },
    { label: '考试场次', desc: '发布与管理场次', icon: Setting, type: '' },
    { label: '考试审核', desc: '审核考试报名', icon: Document, type: 'danger' },
    { label: '教练申请审核', desc: '审核教练申请', icon: Files, type: 'warning' },
    { label: '教练分配', desc: '为学员分配教练', icon: School, type: 'success' },
    { label: '文件管理', desc: '管理所有文件', icon: FolderOpened, type: 'info' },
    { label: '统计报表', desc: '查看统计数据', icon: DataAnalysis, type: 'danger' },
  ],
}

const menuItems = computed(() => menuMap[userStore.role] || [])

function handleClick(item) {
  ElMessage.info(`「${item.label}」功能待开发`)
}
</script>

<style lang="scss" scoped>
.home {
  max-width: 960px;
  margin: 32px auto;
}

.welcome-card {
  margin-bottom: 24px;

  :deep(.el-card__body) {
    padding: 28px 32px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;

  h2 {
    font-size: 22px;
    margin: 0 0 4px;
  }

  .user-info {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
}

.functions-card {
  .functions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
}

.function-item {
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
}

.function-btn {
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;

  .btn-label {
    font-size: 13px;
    line-height: 1;
  }
}

.btn-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #999;
}
</style>
