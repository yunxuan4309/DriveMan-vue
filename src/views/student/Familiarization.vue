<template>
  <div class="familiarization">
    <!-- 申请合场 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>申请合场</span>
      </template>

      <!-- 筛选考试场次 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="searchForm.subject" placeholder="请选择科目" clearable style="width: 140px">
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option v-for="t in licenseTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="sessionDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="searchForm.location" placeholder="考试地点" clearable style="width: 160px" @keyup.enter="searchSessions" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSessions">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="sessionList" v-loading="sessionLoading" border stripe>
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
        <el-table-column label="考试地点" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="剩余名额" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.remainingQuota > 0 ? 'success' : 'danger'" size="small">
              {{ row.remainingQuota }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown @command="(cmd) => handleApply(row, cmd)" trigger="click">
              <el-button type="primary" size="small" :disabled="row.remainingQuota <= 0">
                申请合场<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">教练车（¥{{ getPrice(row, 1) }}）</el-dropdown-item>
                  <el-dropdown-item :command="2">考试车（¥{{ getPrice(row, 2) }}）</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 考试场次分页 -->
      <div class="pagination-wrapper" v-if="sessionTotal > 0">
        <el-pagination
          v-model:current-page="sessionPage"
          v-model:page-size="sessionPageSize"
          :total="sessionTotal"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          @size-change="sessionPage = 1; fetchSessions()"
          @current-change="fetchSessions"
        />
      </div>
    </el-card>

    <!-- 我的合场记录 -->
    <el-card>
      <template #header>
        <span>我的合场记录</span>
        <el-button text type="primary" @click="fetchMyRecords" :icon="Refresh">刷新</el-button>
      </template>

      <el-table :data="recordList" v-loading="recordLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用车类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.carType === 1 ? '' : 'warning'">
              {{ row.carType === 1 ? '教练车' : '考试车' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.exam_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.venue_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="教练" width="100" align="center">
          <template #default="{ row }">
            {{ row.coach_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="安排时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.scheduledTime ? formatDateTime(row.scheduledTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="90" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="handlePay(row)"
            >
              支付
            </el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="recordTotal > 0">
        <el-pagination v-model:current-page="recordPage" v-model:page-size="recordPageSize" :total="recordTotal" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" @size-change="recordPage = 1; fetchMyRecords()" @current-change="fetchMyRecords" />
      </div>

      <el-empty v-if="!recordLoading && recordList.length === 0" description="暂无合场记录" style="margin-top: 30px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Refresh } from '@element-plus/icons-vue'
import { getExamSessionList } from '@/api/exam'
import { applyFamiliarization, payFamiliarization, getMyFamiliarizations, CarType } from '@/api/familiarization'

const licenseTypes = ['C1', 'C2', 'C5', 'C6', 'B1', 'B2', 'A1', 'A2', 'A3', 'D', 'E', 'F', 'M', 'N', 'P']

const sessionList = ref([])
const sessionLoading = ref(false)
const sessionTotal = ref(0)
const sessionPage = ref(1)
const sessionPageSize = ref(10)
const sessionDateRange = ref(null)

const recordList = ref([])
const recordLoading = ref(false)
const recordTotal = ref(0)
const recordPage = ref(1)
const recordPageSize = ref(10)

const searchForm = reactive({
  subject: 2,
  licenseType: undefined,
  location: '',
})

// 预估价格（实际价格由后端 fee_standard 计算）
const priceEstimate = {
  2: { 1: 200, 2: 350 },  // 科目二
  3: { 1: 250, 2: 400 },  // 科目三
}

function getPrice(row, carType) {
  return priceEstimate[row.subject]?.[carType] || (carType === 1 ? 200 : 350)
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'info', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待支付', 1: '已支付', 2: '已完成', 3: '已取消' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildSessionParams() {
  const params = {
    page: sessionPage.value,
    size: sessionPageSize.value,
  }
  if (searchForm.subject) params.subject = searchForm.subject
  if (searchForm.licenseType) params.licenseType = searchForm.licenseType
  if (searchForm.location) params.location = searchForm.location
  if (sessionDateRange.value) {
    params.examDateStart = sessionDateRange.value[0]
    params.examDateEnd = sessionDateRange.value[1]
  }
  return params
}

async function fetchSessions() {
  sessionLoading.value = true
  try {
    const res = await getExamSessionList(buildSessionParams())
    sessionList.value = res.records || []
    sessionTotal.value = res.total || 0
  } catch (error) {
    console.error('获取考试场次失败:', error)
  } finally {
    sessionLoading.value = false
  }
}

function searchSessions() {
  sessionPage.value = 1
  fetchSessions()
}

function resetSearch() {
  searchForm.subject = 2
  searchForm.licenseType = undefined
  searchForm.location = ''
  sessionDateRange.value = null
  sessionPage.value = 1
  fetchSessions()
}

async function fetchMyRecords() {
  recordLoading.value = true
  try {
    const params = { page: recordPage.value, size: recordPageSize.value }
    const res = await getMyFamiliarizations(params)
    recordList.value = Array.isArray(res) ? res : res.records || []
    recordTotal.value = res.total || recordList.value.length
  } catch (error) {
    console.error('获取合场记录失败:', error)
  } finally {
    recordLoading.value = false
  }
}

async function handleApply(row, carType) {
  const carTypeName = carType === 1 ? '教练车' : '考试车'
  const price = getPrice(row, carType)

  try {
    await ElMessageBox.confirm(
      `确定申请「${row.licenseType} 科目${row.subject}」合场吗？\n用车类型：${carTypeName}\n预估费用：¥${price}`,
      '确认申请',
      { type: 'info' }
    )
    await applyFamiliarization(row.id, carType)
    ElMessage.success('合场申请成功，请在合场记录中完成支付')
    fetchSessions()
    fetchMyRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请合场失败:', error)
    }
  }
}

async function handlePay(row) {
  try {
    await ElMessageBox.confirm(
      `确定支付合场费用 ¥${row.amount} 吗？`,
      '确认支付',
      { type: 'info' }
    )
    await payFamiliarization(row.id)
    ElMessage.success('支付成功')
    fetchMyRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败:', error)
    }
  }
}

onMounted(() => {
  fetchSessions()
  fetchMyRecords()
})
</script>

<style scoped lang="scss">
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.text-gray {
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
