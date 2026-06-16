<template>
  <div class="profile-page">
    <!-- 管理员暂不支持 -->
    <el-card v-if="userStore.role === 3" class="profile-card">
      <el-result icon="info" title="功能开发中" sub-title="管理员个人信息页正在开发，敬请期待" />
    </el-card>

    <!-- 加载中 -->
    <el-card v-else-if="loading" class="profile-card">
      <el-skeleton :rows="10" animated />
    </el-card>

    <!-- 学员个人信息 -->
    <template v-else-if="profile.role === 1">
      <!-- 头像区 -->
      <el-card class="profile-card header-card">
        <div class="header-row">
          <el-avatar :size="72" :icon="UserFilled" :src="profile.basic?.avatar" />
          <div class="header-text">
            <h2>{{ profile.basic?.realName || '-' }}</h2>
            <p>
              <el-tag size="small" :type="statusTag(profile.basic?.status)">
                {{ profile.basic?.statusDesc || '-' }}
              </el-tag>
              <span class="sep">|</span>
              <span>当前驾照 {{ profile.basic?.licenseType || '-' }}</span>
              <template v-if="profile.basic?.originalEnrollLicense && profile.basic?.originalEnrollLicense !== profile.basic?.licenseType">
                <span class="sep">|</span>
                <span style="color: #909399; font-size: 13px">原始报名 {{ profile.basic.originalEnrollLicense }}</span>
              </template>
              <template v-if="profile.progress?.hasActiveUpgrade">
                <span class="sep">|</span>
                <el-tag size="small" type="warning">增驾中 → {{ profile.progress.upgradeTargetLicense }}</el-tag>
              </template>
              <span v-if="profile.progress?.allPassed" class="sep">|</span>
              <el-tag v-if="profile.progress?.allPassed" size="small" type="success">已结业</el-tag>
            </p>
          </div>
        </div>
      </el-card>

      <!-- 基本信息 -->
      <el-card class="profile-card">
        <template #header><span class="card-title">基本信息</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账号">{{ profile.basic?.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ profile.basic?.phone }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ profile.basic?.idCard }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ profile.basic?.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="入学时间">{{ fmt(profile.basic?.enrollDate) }}</el-descriptions-item>
          <el-descriptions-item label="当前驾照">
            <span>{{ profile.basic?.licenseType || '-' }}</span>
            <template v-if="profile.basic?.originalEnrollLicense && profile.basic?.originalEnrollLicense !== profile.basic?.licenseType">
              <el-tag size="small" type="info" style="margin-left: 6px">
                原始报名 {{ profile.basic.originalEnrollLicense }}
              </el-tag>
            </template>
            <el-tag v-if="profile.basic?.licenseObtainedDate" size="small" type="success" style="margin-left: 6px">
              已获取 {{ fmtDate(profile.basic.licenseObtainedDate) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="profile.basic?.existingLicense" label="已有驾照">
            {{ profile.basic.existingLicense }}
            <span v-if="profile.basic.existingLicenseYears"> ({{ profile.basic.existingLicenseYears }}年)</span>
            <el-button v-if="profile.basic.existingLicenseFileId" link type="primary" size="small" @click="previewFile(profile.basic.existingLicenseFileId)" style="margin-left: 4px">
              查看证明
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item v-if="profile.progress?.hasActiveUpgrade" label="增驾目标">
            <el-tag type="warning" size="small">{{ profile.progress.upgradeTargetLicense }}</el-tag>
            <span style="margin-left: 6px; color: #909399; font-size: 13px">考试进行中</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 增驾历史 -->
      <el-card v-if="profile.upgradeHistory?.length" class="profile-card">
        <template #header><span class="card-title">增驾历史</span></template>
        <el-timeline>
          <el-timeline-item
            v-for="(item, idx) in profile.upgradeHistory"
            :key="idx"
            :timestamp="fmt(item.completeTime)"
            placement="top"
            :type="idx === profile.upgradeHistory.length - 1 ? 'primary' : 'success'">
            <span>{{ item.originalLicense }} → {{ item.targetLicense }}</span>
            <el-tag v-if="item.targetLicense === profile.basic?.licenseType" size="small" type="success" style="margin-left: 8px">当前驾照</el-tag>
            <el-tag v-if="idx === 0 && item.originalLicense === profile.basic?.originalEnrollLicense" size="small" type="info" style="margin-left: 4px">原始报名</el-tag>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 报名套餐 -->
      <el-card v-if="Object.keys(profile.enrollment || {}).length" class="profile-card">
        <template #header><span class="card-title">报名套餐</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="套餐名称">{{ profile.enrollment?.packageName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="套餐金额">¥{{ fmtAmount(profile.enrollment?.packageAmount) }}</el-descriptions-item>
          <el-descriptions-item label="套餐类型">
            <el-tag v-if="profile.enrollment?.isFullPackage" type="success" size="small">全包套餐</el-tag>
            <el-tag v-else type="info" size="small">普通套餐</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 绑定教练 -->
      <el-card v-if="Object.keys(profile.coach || {}).length" class="profile-card">
        <template #header><span class="card-title">绑定教练</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="教练姓名">{{ profile.coach?.coachName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评分">
            <span v-if="profile.coach?.coachRating !== undefined">⭐{{ profile.coach.coachRating }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="执教年限">{{ profile.coach?.coachYears || 0 }} 年</el-descriptions-item>
          <el-descriptions-item label="准教车型">{{ profile.coach?.coachVehicleType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绑定时间">{{ fmt(profile.coach?.bindTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 学习进度 -->
      <el-card class="profile-card">
        <template #header><span class="card-title">学习进度</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="完成进度">
            <el-progress :percentage="profile.progress?.progressPercent || 0" :stroke-width="16" style="width: 200px" />
          </el-descriptions-item>
          <el-descriptions-item label="结业状态">
            <el-tag v-if="profile.progress?.allPassed" type="success">已结业</el-tag>
            <el-tag v-else type="info">在学中</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="profile.progress?.passedSubjects?.length" style="margin-top: 12px">
          <p class="sub-title">已通过科目</p>
          <template v-for="s in profile.progress.passedSubjects" :key="s.subject">
            <el-tag v-if="s.status === 'skipped'"
              type="success" size="small" style="margin: 2px" effect="plain">
              {{ s.description || '科目' + s.subject }}（免考）
            </el-tag>
            <el-tag v-else
              type="success" size="small" style="margin: 2px">
              {{ s.description || '科目' + s.subject }} ({{ s.score }}分)
            </el-tag>
          </template>
        </div>
      </el-card>

      <!-- 体检状态 -->
      <el-card v-if="Object.keys(profile.physical || {}).length" class="profile-card">
        <template #header><span class="card-title">体检状态</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="车型">{{ profile.physical?.licenseType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="phyStatusTag(profile.physical?.status)" size="small">
              {{ profile.physical?.statusDesc || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag v-if="profile.physical?.result === 1" type="success" size="small">合格</el-tag>
            <el-tag v-else-if="profile.physical?.result === 0" type="danger" size="small">不合格</el-tag>
            <span v-else class="text-gray">未出结果</span>
          </el-descriptions-item>
          <el-descriptions-item label="体检日期">{{ profile.physical?.examDate || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 缴费概况 -->
      <el-card class="profile-card">
        <template #header><span class="card-title">缴费概况</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="累计应缴">¥{{ fmtAmount(profile.payment?.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="已缴费">¥{{ fmtAmount(profile.payment?.totalPaid) }}</el-descriptions-item>
          <el-descriptions-item label="待缴费">¥{{ fmtAmount(profile.payment?.totalUnpaid) }}</el-descriptions-item>
          <el-descriptions-item label="已缴笔数">{{ profile.payment?.paidCount || 0 }} 笔</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>

    <!-- 教练个人信息 -->
    <template v-else-if="profile.role === 2">
      <!-- 头像区 -->
      <el-card class="profile-card header-card">
        <div class="header-row">
          <el-avatar :size="72" :icon="UserFilled" :src="profile.basic?.avatar" />
          <div class="header-text">
            <h2>{{ profile.basic?.realName || '-' }}</h2>
            <p>
              <el-tag size="small" type="success">教练</el-tag>
              <span class="sep">|</span>
              <span>评分 ⭐{{ profile.basic?.rating || '-' }}</span>
            </p>
          </div>
        </div>
      </el-card>

      <!-- 基本信息 -->
      <el-card class="profile-card">
        <template #header><span class="card-title">基本信息</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账号">{{ profile.basic?.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ profile.basic?.phone }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ profile.basic?.idCard }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ profile.basic?.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ fmt(profile.basic?.registerDate) }}</el-descriptions-item>
          <el-descriptions-item label="执教年限">{{ profile.basic?.coachYears || 0 }} 年</el-descriptions-item>
          <el-descriptions-item label="准教车型" :span="2">
            <el-tag v-for="t in (profile.basic?.vehicleType || '').split(',')" :key="t" size="small" style="margin: 1px">
              {{ t }}
            </el-tag>
            <span v-if="!profile.basic?.vehicleType" class="text-gray">-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 教学概况 -->
      <el-card class="profile-card">
        <template #header><span class="card-title">教学概况</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名下学员">{{ profile.stats?.studentCount || 0 }} 人</el-descriptions-item>
          <el-descriptions-item label="累计教学学时">{{ profile.stats?.totalTrainingHours || 0 }} 小时</el-descriptions-item>
          <el-descriptions-item label="学员通过率">{{ profile.stats?.passRate || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="参加考试学员">{{ profile.stats?.totalExamStudents || 0 }} 人</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>

    <el-empty v-if="!loading && !profile.role" description="暂无个人信息" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useFilePreview } from '@/composables/useFilePreview'
import { getProfile } from '@/api/profile'

const userStore = useUserStore()
const profile = ref({})
const loading = ref(true)

onMounted(async () => {
  if (userStore.role === 3) {
    loading.value = false
    return
  }
  try {
    const res = await getProfile()
    profile.value = res || {}
  } catch (e) {
    console.error('获取个人信息失败:', e)
  } finally {
    loading.value = false
  }
})

function fmt(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function fmtAmount(n) {
  if (n === undefined || n === null) return '0.00'
  return Number(n).toFixed(2)
}

function previewFile(fileId) {
  const { previewFile: doPreview } = useFilePreview()
  doPreview(fileId)
}

function statusTag(s) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[s] || 'info'
}

function phyStatusTag(s) {
  return { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'success' }[s] || 'info'
}
</script>

<style scoped lang="scss">
.profile-page {
  max-width: 700px;
  margin: 24px auto;
  padding-bottom: 32px;
}

.profile-card {
  margin-bottom: 16px;
}

.header-card {
  .header-row {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .header-text h2 {
    margin: 0 0 6px;
    font-size: 22px;
  }
  .header-text p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.sep {
  margin: 0 8px;
  color: #dcdfe6;
}

.card-title {
  font-weight: 600;
}

.sub-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.text-gray {
  color: #909399;
}
</style>
