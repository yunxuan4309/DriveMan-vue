<template>
  <div class="exam-registration">
    <!-- 考试场次 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>考试场次</span>
          <el-button text type="primary" @click="fetchSessions" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="sessionSearch" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="sessionSearch.subject" placeholder="全部科目" clearable style="width: 110px">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="sessionSearch.licenseType" placeholder="全部车型" clearable style="width: 100px">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="sessionSearch.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSessionSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleSessionReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="sessionList" v-loading="sessionLoading" border stripe>
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="科目" width="75" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用车型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examDate" label="考试日期" width="110" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="90" align="center" />
        <el-table-column prop="location" label="考试地点" min-width="150" show-overflow-tooltip />
        <el-table-column label="名额" width="110" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.remainingQuota > 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.remainingQuota }}/{{ row.totalQuota }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.remainingQuota <= 0"
              :loading="registeringId === row.id"
              @click="handleRegister(row)"
            >
              报名
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="sessionTotal > 0">
        <el-pagination
          v-model:current-page="sessionPagination.page"
          v-model:page-size="sessionPagination.size"
          :total="sessionTotal"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="fetchSessions"
          @current-change="fetchSessions"
        />
      </div>
    </el-card>

    <!-- 我的报名记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的报名记录</span>
          <el-button text type="primary" @click="fetchRegistrations" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-form :model="regSearch" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="regSearch.subject" placeholder="全部科目" clearable style="width: 110px" @change="handleRegSearch">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="regSearch.status" placeholder="全部状态" clearable style="width: 120px" @change="handleRegSearch">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核不通过" :value="2" />
            <el-option label="已考试" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleRegReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="regList" v-loading="regLoading" border stripe>
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="科目" width="75" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用车型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="90" align="center">
          <template #default="{ row }">
            {{ row.startTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="70" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="{ color: row.score >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ row.score }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="regTotal > 0">
        <el-pagination
          v-model:current-page="regPagination.page"
          v-model:page-size="regPagination.size"
          :total="regTotal"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="fetchRegistrations"
          @current-change="fetchRegistrations"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getExamSessionList, createExamRegistration, getStudentExamRegistrations } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// ---- 考试场次 ----
const sessionList = ref([])
const sessionLoading = ref(false)
const sessionTotal = ref(0)
const registeringId = ref(null)
const sessionPagination = reactive({ page: 1, size: 10 })
const sessionSearch = reactive({
  subject: undefined,
  licenseType: undefined,
  dateRange: null,
})

async function fetchSessions() {
  sessionLoading.value = true
  try {
    const params = { page: sessionPagination.page, size: sessionPagination.size }
    if (sessionSearch.subject) params.subject = sessionSearch.subject
    if (sessionSearch.licenseType) params.licenseType = sessionSearch.licenseType
    if (sessionSearch.dateRange) {
      params.examDateStart = sessionSearch.dateRange[0]
      params.examDateEnd = sessionSearch.dateRange[1]
    }
    const res = await getExamSessionList(params)
    sessionList.value = res.records || []
    sessionTotal.value = res.total || 0
  } catch (error) {
    console.error('获取考试场次失败:', error)
  } finally {
    sessionLoading.value = false
  }
}

function handleSessionSearch() {
  sessionPagination.page = 1
  fetchSessions()
}

function handleSessionReset() {
  sessionPagination.page = 1
  sessionSearch.subject = undefined
  sessionSearch.licenseType = undefined
  sessionSearch.dateRange = null
  fetchSessions()
}

// ---- 报名记录 ----
const regList = ref([])
const regLoading = ref(false)
const regTotal = ref(0)
const regPagination = reactive({ page: 1, size: 10 })
const regSearch = reactive({
  status: undefined,
  subject: undefined,
})

async function fetchRegistrations() {
  regLoading.value = true
  try {
    const params = { page: regPagination.page, size: regPagination.size }
    if (regSearch.status !== undefined && regSearch.status !== '') params.status = regSearch.status
    if (regSearch.subject !== undefined && regSearch.subject !== '') params.subject = regSearch.subject
    const res = await getStudentExamRegistrations(userStore.userId, params)
    regList.value = res.records || []
    regTotal.value = res.total || 0
  } catch (error) {
    console.error('获取报名记录失败:', error)
  } finally {
    regLoading.value = false
  }
}

function handleRegSearch() {
  regPagination.page = 1
  fetchRegistrations()
}

function handleRegReset() {
  regPagination.page = 1
  regSearch.status = undefined
  regSearch.subject = undefined
  fetchRegistrations()
}

// ---- 操作 ----
async function handleRegister(session) {
  try {
    await ElMessageBox.confirm(
      `确定报名科目${session.subject}（${session.examDate}）的考试吗？`,
      '确认报名',
      { type: 'info' }
    )
    registeringId.value = session.id
    await createExamRegistration(userStore.userId, session.id)
    ElMessage.success('报名成功，等待审核')
    fetchSessions()
    fetchRegistrations()
  } catch (error) {
    if (error !== 'cancel') console.error('报名失败:', error)
  } finally {
    registeringId.value = null
  }
}

function statusTagType(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }[status] || 'info'
}
function statusText(status) {
  return { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已考试' }[status] || '未知'
}

onMounted(() => {
  fetchSessions()
  fetchRegistrations()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  :deep(.el-form-item) { margin-bottom: 0; margin-right: 12px; }
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.text-gray { color: #909399; }
</style>
