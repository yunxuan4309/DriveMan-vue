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
import { useRouter } from 'vue-router'
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
  Money,
  Bicycle,
  OfficeBuilding,
  Van,
  Refresh,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const menuMap = {
  1: [
    { label: '约课管理', desc: '预约或取消课程', icon: Calendar, type: 'primary', route: '/student/appointment' },
    { label: '考试报名', desc: '报名考试场次', icon: Edit, type: 'success', route: '/student/exam-registration' },
    { label: '教练申请', desc: '选择并申请教练', icon: User, type: 'warning', route: '/student/coach-apply' },
    { label: '文件管理', desc: '上传与查看文件', icon: FolderOpened, type: 'info', route: '/student/files' },
    { label: '我的成绩', desc: '查看考试成绩', icon: Trophy, type: 'danger', route: '/student/scores' },
    { label: '合场申请', desc: '申请考试合场', icon: Van, type: '', route: '/student/familiarization' },
    { label: '我的账单', desc: '查看支付记录', icon: Money, type: '', route: '/student/payments' },
    { label: '二次培训', desc: '挂科补考培训', icon: Edit, type: '', route: '/student/retake-training' },
  ],
  2: [
    { label: '我的课程', desc: '查看课程安排', icon: Calendar, type: 'primary', route: '/coach/courses' },
    { label: '学员管理', desc: '查看绑定的学员', icon: School, type: 'success', route: '/coach/students' },
    { label: '学员移交', desc: '申请移交学员', icon: Refresh, type: 'warning', route: '/coach/student-transfer' },
    { label: '学员考试', desc: '查看学员考试状态', icon: Trophy, type: 'warning', route: '/coach/exam' },
    { label: '考试场次', desc: '查看考试场次信息', icon: Edit, type: 'info', route: '/coach/exam-sessions' },
    { label: '准教车型申请', desc: '申请增加可教车型', icon: Bicycle, type: '', route: '/coach/vehicle-application' },
    { label: '文件管理', desc: '上传和管理文件', icon: FolderOpened, type: '', route: '/coach/files' },
    { label: '二次培训', desc: '学员补考培训', icon: Edit, type: '', route: '/coach/retake-training' },
  ],
  3: [
    { label: '学员管理', desc: '管理所有学员', icon: Avatar, type: 'primary', route: '/admin/students' },
    { label: '教练管理', desc: '管理教练信息', icon: User, type: 'success', route: '/admin/coaches' },
    { label: '报名审核', desc: '审核学员报名', icon: Edit, type: 'warning', route: '/admin/registration-review' },
    { label: '约课管理', desc: '查看所有约课', icon: Calendar, type: 'info' },
    { label: '考试场次', desc: '发布与管理场次', icon: Setting, type: '', route: '/admin/exam-sessions' },
    { label: '考试审核', desc: '审核考试报名', icon: Document, type: 'danger', route: '/admin/exam-review' },
    { label: '教练申请审核', desc: '审核教练申请', icon: Files, type: 'warning', route: '/admin/coach-application-review' },
    { label: '教练分配', desc: '为学员分配教练', icon: School, type: 'success', route: '/admin/coach-assignment' },
    { label: '文件管理', desc: '管理所有文件', icon: FolderOpened, type: 'info', route: '/admin/files' },
    { label: '统计报表', desc: '查看统计数据', icon: DataAnalysis, type: 'danger', route: '/admin/statistics' },
    { label: '费用标准', desc: '管理培训费用', icon: Money, type: 'primary', route: '/admin/fee-standards' },
    { label: '车型配置', desc: '管理车型科目', icon: Bicycle, type: 'success', route: '/admin/license-configs' },
    { label: '考场管理', desc: '管理考场信息', icon: OfficeBuilding, type: 'warning', route: '/admin/exam-venues' },
    { label: '特种车辆考试', desc: '管理特种车辆成绩', icon: Van, type: 'info', route: '/admin/special-exams' },
    { label: '准教车型审核', desc: '审核教练车型变更', icon: Bicycle, type: '', route: '/admin/vehicle-application-review' },
    { label: '合场管理', desc: '管理合场安排', icon: Van, type: '', route: '/admin/familiarization-manage' },
    { label: '支付管理', desc: '管理支付账单', icon: Money, type: '', route: '/admin/payment-manage' },
    { label: '二次培训', desc: '管理补考培训审核', icon: Edit, type: '', route: '/admin/retake-training' },
  ],
}

const menuItems = computed(() => menuMap[userStore.role] || [])

function handleClick(item) {
  if (item.route) {
    router.push(item.route)
  } else {
    ElMessage.info(`「${item.label}」功能待开发`)
  }
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
