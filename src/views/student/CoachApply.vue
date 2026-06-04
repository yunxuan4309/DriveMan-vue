<template>
  <div class="coach-apply">
    <!-- 我的教练 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>我的教练</span>
      </template>
      <div v-loading="myCoachLoading">
        <div v-if="myCoach" class="my-coach-info">
          <el-avatar :size="56" icon="UserFilled" style="flex-shrink: 0" />
          <div class="coach-detail">
            <h3>{{ myCoach.realName }}</h3>
            <p>
              <el-tag size="small">{{ myCoach.vehicleType }}</el-tag>
              <span style="margin-left: 12px">
                <el-rate v-model="myCoach.rating" disabled show-score score-template="{value}" />
              </span>
            </p>
            <p class="text-gray">教龄 {{ myCoach.coachYears }} 年 · 绑定时间：{{ formatDateTime(myCoach.bindTime) }}</p>
          </div>
        </div>
        <el-empty v-else description="您当前没有绑定的教练" />
      </div>
    </el-card>

    <!-- 推荐教练 & 全部教练 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>教练列表</span>
        </div>
      </template>
      <el-tabs v-model="coachTab">
        <el-tab-pane label="推荐教练" name="recommend">
          <div v-loading="recommendLoading">
            <el-row :gutter="16" v-if="recommendList.length > 0">
              <el-col :xs="24" :sm="12" :md="8" v-for="c in recommendList" :key="c.coachId" style="margin-bottom: 16px">
                <el-card shadow="hover" class="coach-card" :class="{ 'is-recommended': true }">
                  <div class="coach-item">
                    <el-avatar :size="48" icon="UserFilled" />
                    <div class="coach-info">
                      <h4>{{ c.realName || '教练' }}</h4>
                      <p>
                        <el-tag size="small">{{ c.vehicleType }}</el-tag>
                        <el-rate v-model="c.rating" disabled show-score size="small" score-template="{value}" style="display: inline-block; margin-left: 4px" />
                      </p>
                      <p class="coach-detail">{{ c.coachYears }} 年教龄</p>
                    </div>
                    <el-button type="warning" size="small" :loading="applyingId === c.coachId" @click="handleApply(c)">申请</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-else description="暂无推荐教练" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="全部教练" name="all">
          <div v-loading="coachLoading">
            <el-row :gutter="16" v-if="coachList.length > 0">
              <el-col :xs="24" :sm="12" :md="8" v-for="c in coachList" :key="c.coachId" style="margin-bottom: 16px">
                <el-card shadow="hover" class="coach-card">
                  <div class="coach-item">
                    <el-avatar :size="48" icon="UserFilled" />
                    <div class="coach-info">
                      <h4>{{ c.realName || '教练' }}</h4>
                      <p>
                        <el-tag size="small">{{ c.vehicleType }}</el-tag>
                        <el-rate v-model="c.rating" disabled show-score size="small" score-template="{value}" style="display: inline-block; margin-left: 4px" />
                      </p>
                      <p class="coach-detail">{{ c.coachYears }} 年教龄</p>
                    </div>
                    <el-button type="warning" size="small" :loading="applyingId === c.coachId" @click="handleApply(c)">申请</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-else description="暂无教练数据" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 我的申请记录 -->
    <el-card>
      <template #header>
        <span>我的申请记录</span>
        <el-button text type="primary" @click="fetchApplications" :icon="Refresh">刷新</el-button>
      </template>
      <el-table :data="applicationList" v-loading="appLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="coachName" label="目标教练" width="100">
          <template #default="{ row }">
            {{ row.coachName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 2 && row.auditReason" style="color: #f56c6c">{{ row.auditReason }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.auditTime ? formatDateTime(row.auditTime) : '-' }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="appPagination.page"
          v-model:page-size="appPagination.size"
          :total="appPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[5, 10, 20]"
          @size-change="fetchApplications"
          @current-change="fetchApplications"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, StarFilled, UserFilled } from '@element-plus/icons-vue'
import { getCoachList, applyCoach, getStudentApplications, getMyCoach, recommendCoaches } from '@/api/coach'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const myCoachLoading = ref(false)
const myCoach = ref(null)

const coachTab = ref('recommend')
const recommendList = ref([])
const recommendLoading = ref(false)
const coachList = ref([])
const coachLoading = ref(false)
const applyingId = ref(null)

const applicationList = ref([])
const appLoading = ref(false)
const appPagination = ref({ page: 1, size: 10, total: 0 })

async function fetchMyCoach() {
  myCoachLoading.value = true
  try {
    const res = await getMyCoach(userStore.userId)
    myCoach.value = res || null
  } catch (error) {
    console.error('获取我的教练失败:', error)
    myCoach.value = null
  } finally {
    myCoachLoading.value = false
  }
}

async function fetchRecommend() {
  recommendLoading.value = true
  try {
    const res = await recommendCoaches(userStore.userId, 6)
    recommendList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取推荐教练失败:', error)
    recommendList.value = []
  } finally {
    recommendLoading.value = false
  }
}

async function fetchCoaches() {
  coachLoading.value = true
  try {
    const res = await getCoachList()
    coachList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取教练列表失败:', error)
  } finally {
    coachLoading.value = false
  }
}

async function fetchApplications() {
  appLoading.value = true
  try {
    const res = await getStudentApplications(userStore.userId)
    applicationList.value = Array.isArray(res) ? res : []
    appPagination.value.total = applicationList.value.length
  } catch (error) {
    console.error('获取申请记录失败:', error)
  } finally {
    appLoading.value = false
  }
}

async function handleApply(coach) {
  try {
    await ElMessageBox.confirm(
      `确定要申请 "${coach.realName || '教练'}" 作为您的教练吗？`,
      '确认申请',
      { type: 'info' }
    )
    applyingId.value = coach.coachId
    await applyCoach(userStore.userId, coach.coachId)
    ElMessage.success('申请已提交，等待管理员审核')
    fetchApplications()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请失败:', error)
    }
  } finally {
    applyingId.value = null
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  fetchMyCoach()
  fetchRecommend()
  fetchCoaches()
  fetchApplications()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.my-coach-info {
  display: flex;
  align-items: center;
  gap: 20px;
  .coach-detail {
    h3 { margin: 0 0 6px; font-size: 18px; }
    p { margin: 4px 0; font-size: 14px; }
  }
}
.coach-card {
  cursor: pointer;
  :deep(.el-card__body) { padding: 16px; }
  &.is-recommended {
    border-left: 3px solid #e6a23c;
  }
}
.coach-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.coach-info {
  flex: 1;
  min-width: 0;
  h4 { margin: 0 0 2px; font-size: 15px; }
  p { margin: 2px 0; font-size: 13px; color: #666; }
  .coach-detail { color: #999; }
}
.text-gray { color: #909399; }
</style>
