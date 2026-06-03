<template>
  <div class="exam-registration">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考试报名</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="searchForm.subject" placeholder="全部科目" clearable style="width: 120px">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="sessionList" v-loading="sessionLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="subject" label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="licenseType" label="适用车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examDate" label="考试日期" width="120" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="100" align="center" />
        <el-table-column prop="location" label="考试地点" min-width="150" show-overflow-tooltip />
        <el-table-column prop="totalQuota" label="总名额" width="80" align="center" />
        <el-table-column prop="remainingQuota" label="剩余名额" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.remainingQuota > 0 ? 'success' : 'danger'" size="small">
              {{ row.remainingQuota }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
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
    </el-card>

      <!-- 我的报名记录 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <span>我的报名记录</span>
        </template>
        <el-table :data="regList" v-loading="regLoading" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="科目" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="适用车型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="考试日期" width="120" align="center">
            <template #default="{ row }">
              {{ row.examDate || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="100" align="center">
            <template #default="{ row }">
              {{ row.startTime || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="考试地点" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.location || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成绩" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.score != null" :style="{ color: row.score >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                {{ row.score }}
              </span>
              <span v-else class="text-gray">-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamSessionList, createExamRegistration, getStudentExamRegistrations } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const sessionList = ref([])
const sessionLoading = ref(false)
const registeringId = ref(null)

// 搜索表单
const searchForm = reactive({
  subject: undefined,
})

const regList = ref([])
const regLoading = ref(false)
const regPagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchSessions() {
  sessionLoading.value = true
  try {
    const params = {}
    if (searchForm.subject) params.subject = searchForm.subject
    const res = await getExamSessionList(params)
    sessionList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取考试场次失败:', error)
  } finally {
    sessionLoading.value = false
  }
}

function handleSearch() {
  fetchSessions()
}

function handleReset() {
  searchForm.subject = undefined
  fetchSessions()
}

async function fetchRegistrations() {
  regLoading.value = true
  try {
    const res = await getStudentExamRegistrations(userStore.userId)
    regList.value = Array.isArray(res) ? res : []
    regPagination.total = regList.value.length
  } catch (error) {
    console.error('获取报名记录失败:', error)
  } finally {
    regLoading.value = false
  }
}

async function handleRegister(session) {
  try {
    await ElMessageBox.confirm(
      `确定报名科目${session.subject} ${session.examDate} 的考试吗？`,
      '确认报名',
      { type: 'info' }
    )
    registeringId.value = session.id
    await createExamRegistration(userStore.userId, session.id)
    ElMessage.success('报名成功，等待审核')
    fetchSessions()
    fetchRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('报名失败:', error)
    }
  } finally {
    registeringId.value = null
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已考试' }
  return map[status] || '未知'
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
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.text-gray { color: #909399; }
</style>
