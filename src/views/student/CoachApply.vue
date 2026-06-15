<template>
  <div class="coach-apply">
    <!-- 我的教练 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>我的教练</span>
      </template>
      <div v-loading="myCoachLoading">
        <div v-if="myCoach" class="my-coach-info" @click="showMyCoachDetail" style="cursor: pointer">
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

    <!-- 教练列表 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>教练列表</span>
        </div>
      </template>
      <el-tabs v-model="coachTab" @tab-change="onTabChange">
        <el-tab-pane label="推荐教练" name="recommend">
          <div v-loading="recommendLoading">
            <el-row :gutter="16" v-if="recommendList.length > 0">
              <el-col :xs="24" :sm="12" :md="8" v-for="c in recommendList" :key="c.coachId" style="margin-bottom: 16px">
                <el-card shadow="hover" class="coach-card" :class="{ 'is-recommended': true }" @click="showDetail(c)">
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
                    <el-button type="warning" size="small" :loading="applyingId === c.coachId" @click.stop="handleApply(c)">申请</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-else description="暂无推荐教练" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="全部教练" name="all">
          <!-- 搜索栏 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="姓名">
              <el-input v-model="searchForm.realName" placeholder="教练姓名" clearable style="width: 140px" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="车型">
              <el-select v-model="searchForm.vehicleType" placeholder="全部" clearable style="width: 100px">
                <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="评分">
              <el-input-number v-model="searchForm.ratingMin" :min="0" :max="5" :step="0.5" placeholder="最低" style="width: 110px" controls-position="right" />
              <span style="margin: 0 6px; color: #909399">~</span>
              <el-input-number v-model="searchForm.ratingMax" :min="0" :max="5" :step="0.5" placeholder="最高" style="width: 110px" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div v-loading="coachLoading">
            <el-row :gutter="16" v-if="coachList.length > 0">
              <el-col :xs="24" :sm="12" :md="8" v-for="c in coachList" :key="c.coachId" style="margin-bottom: 16px">
                <el-card shadow="hover" class="coach-card" @click="showDetail(c)">
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
                    <el-button type="warning" size="small" :loading="applyingId === c.coachId" @click.stop="handleApply(c)">申请</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-else-if="!coachLoading" description="暂无教练数据" />

            <div class="pagination-container" v-if="coachTotal > searchForm.size">
              <el-pagination
                v-model:current-page="searchForm.page"
                v-model:page-size="searchForm.size"
                :total="coachTotal"
                layout="total, sizes, prev, pager, next, jumper"
                :page-sizes="[6, 12, 18]"
                @size-change="fetchCoaches"
                @current-change="fetchCoaches"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 我的申请记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的申请记录</span>
          <el-button text type="primary" @click="fetchApplications" :icon="Refresh">刷新</el-button>
        </div>
      </template>
      <el-table :data="applicationList" v-loading="appLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="目标教练" width="100" align="center">
          <template #default="{ row }">
            {{ row.coachName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'" size="small">
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
      <div class="pagination-container" v-if="appPagination.total > 0">
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

    <!-- 教练详情弹窗 -->
    <el-dialog v-model="detailVisible" title="教练详情" width="420px" destroy-on-close>
      <div v-if="detailCoach" class="detail-content">
        <div class="detail-header">
          <el-avatar :size="64" icon="UserFilled" />
          <div class="detail-title">
            <h3>{{ detailCoach.realName || '-' }}</h3>
            <el-rate v-model="detailCoach.rating" disabled show-score score-template="{value}" />
          </div>
        </div>
        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="准教车型">
            <el-tag size="small" v-for="t in vehicleTypes" :key="t" style="margin-right: 4px">{{ t }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="教龄">{{ detailCoach.coachYears || '-' }} 年</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailCoach.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="常规空闲（参考）">
            <div v-if="availableTimeList.length > 0">
              <p v-for="item in availableTimeList" :key="item.day" style="margin: 2px 0; font-size: 13px">
                <span style="color: #409eff; font-weight: 500">{{ item.day }}：</span>
                {{ item.slots.join('、') }}
              </p>
            </div>
            <span v-else class="text-gray">暂未设置</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="warning" @click="detailApply" :loading="applyingId === detailCoach?.coachId">申请该教练</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, UserFilled } from '@element-plus/icons-vue'
import { getCoachList, applyCoach, getStudentApplications, getMyCoach, recommendCoaches } from '@/api/coach'
import { useUserStore } from '@/stores/user'

import { LICENSE_TYPES } from '@/config/license'

const userStore = useUserStore()
const myCoachLoading = ref(false)
const myCoach = ref(null)

const coachTab = ref('recommend')
const recommendList = ref([])
const recommendLoading = ref(false)
const coachList = ref([])
const coachLoading = ref(false)
const coachTotal = ref(0)
const applyingId = ref(null)

const searchForm = reactive({
  page: 1, size: 6,
  realName: '',
  vehicleType: undefined,
  ratingMin: undefined,
  ratingMax: undefined,
})

const applicationList = ref([])
const appLoading = ref(false)
const appPagination = ref({ page: 1, size: 10, total: 0 })

// 详情弹窗
const detailVisible = ref(false)
const detailCoach = ref(null)

const vehicleTypes = computed(() => {
  if (!detailCoach.value?.vehicleType) return []
  return detailCoach.value.vehicleType.split(',').map(t => t.trim()).filter(Boolean)
})

const DAY_NAMES = { monday: '周一', tuesday: '周二', wednesday: '周三', thursday: '周四', friday: '周五', saturday: '周六', sunday: '周日' }

const availableTimeList = computed(() => {
  const at = detailCoach.value?.availableTime
  if (!at) return []
  let obj = at
  if (typeof at === 'string') {
    try { obj = JSON.parse(at) } catch { return [] }
  }
  return Object.entries(obj).map(([key, val]) => ({
    day: DAY_NAMES[key] || key,
    slots: Array.isArray(val) ? val : [],
  }))
})

async function fetchMyCoach() {
  myCoachLoading.value = true
  try {
    const res = await getMyCoach(userStore.userId)
    myCoach.value = res || null
  } catch {
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
  } catch {
    recommendList.value = []
  } finally {
    recommendLoading.value = false
  }
}

async function fetchCoaches() {
  coachLoading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.realName) params.realName = searchForm.realName
    if (searchForm.vehicleType) params.vehicleType = searchForm.vehicleType
    if (searchForm.ratingMin != null) params.ratingMin = searchForm.ratingMin
    if (searchForm.ratingMax != null) params.ratingMax = searchForm.ratingMax
    const res = await getCoachList(params)
    coachList.value = res.records || []
    coachTotal.value = res.total || 0
  } catch {
    coachList.value = []
  } finally {
    coachLoading.value = false
  }
}

function onTabChange(name) {
  if (name === 'all' && coachList.value.length === 0) {
    fetchCoaches()
  }
}

function handleSearch() {
  searchForm.page = 1
  fetchCoaches()
}

function handleReset() {
  searchForm.page = 1
  searchForm.realName = ''
  searchForm.vehicleType = undefined
  searchForm.ratingMin = undefined
  searchForm.ratingMax = undefined
  fetchCoaches()
}

async function fetchApplications() {
  appLoading.value = true
  try {
    const res = await getStudentApplications(userStore.userId)
    applicationList.value = Array.isArray(res) ? res : []
    appPagination.value.total = applicationList.value.length
  } catch {
    applicationList.value = []
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
    if (error !== 'cancel') console.error('申请失败:', error)
  } finally {
    applyingId.value = null
  }
}

function showDetail(coach) {
  detailCoach.value = coach
  detailVisible.value = true
}

function showMyCoachDetail() {
  if (myCoach.value) {
    detailCoach.value = myCoach.value
    detailVisible.value = true
  }
}

function detailApply() {
  detailVisible.value = false
  if (detailCoach.value) {
    handleApply(detailCoach.value)
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
.search-form {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  :deep(.el-form-item) { margin-bottom: 0; margin-right: 12px; }
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
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    transform: translateY(-2px);
  }
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

.detail-content {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    .detail-title {
      h3 { margin: 0 0 4px; font-size: 18px; }
    }
  }
}
</style>
