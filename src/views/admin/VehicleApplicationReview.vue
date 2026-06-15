<template>
  <div class="vehicle-application-review">
    <!-- 待审核申请 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>待审核申请</span>
          <el-tag type="warning">{{ pendingTotal }} 条</el-tag>
        </div>
      </template>

      <!-- 待审核搜索栏 -->
      <el-form :model="pendingSearch" inline class="search-form">
        <el-form-item label="教练姓名">
          <el-input v-model="pendingSearch.keyword" placeholder="教练姓名" clearable style="width: 130px" @keyup.enter="fetchPendingList" />
        </el-form-item>
        <el-form-item label="当前车型">
          <el-select v-model="pendingSearch.currentVehicleType" placeholder="全部" clearable style="width: 100px" @change="fetchPendingList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请车型">
          <el-select v-model="pendingSearch.requestedVehicleType" placeholder="全部" clearable style="width: 100px" @change="fetchPendingList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="pendingSearch.applyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 220px"
            @change="fetchPendingList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPendingList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetPendingSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pendingList" v-loading="pendingLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="教练姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.coachName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.currentVehicleType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请车型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.requestedVehicleType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请理由" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handlePass(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 待审核分页 -->
      <div class="pagination-wrapper" v-if="pendingTotal > 0">
        <el-pagination
          v-model:current-page="pendingPage"
          v-model:page-size="pendingSize"
          :total="pendingTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchPendingList"
        />
      </div>
    </el-card>

    <!-- 全部申请记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>全部申请记录</span>
        </div>
      </template>

      <!-- 全部记录搜索栏 -->
      <el-form :model="historySearch" inline class="search-form">
        <el-form-item label="教练姓名">
          <el-input v-model="historySearch.keyword" placeholder="教练姓名" clearable style="width: 130px" @keyup.enter="fetchHistoryList" />
        </el-form-item>
        <el-form-item label="申请车型">
          <el-select v-model="historySearch.vehicleType" placeholder="全部" clearable style="width: 100px" @change="fetchHistoryList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="historySearch.status" placeholder="全部状态" clearable style="width: 100px" @change="fetchHistoryList">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核时间">
          <el-date-picker
            v-model="historySearch.auditDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 220px"
            @change="fetchHistoryList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchHistoryList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetHistorySearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="historyList" v-loading="historyLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="教练姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.coachName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.currentVehicleType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请车型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.requestedVehicleType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请理由" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.auditReason || '-' }}
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

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="historyTotal > 0">
        <el-pagination
          v-model:current-page="historyPage"
          v-model:page-size="historySize"
          :total="historyTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleHistorySizeChange"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getPendingVehicleApplications, getAllVehicleApplications, auditVehicleApplication } from '@/api/admin'

import { LICENSE_TYPES } from '@/config/license'

// ── 待审核 ──
const pendingLoading = ref(false)
const pendingList = ref([])
const pendingTotal = ref(0)
const pendingPage = ref(1)
const pendingSize = ref(10)

const pendingSearch = reactive({
  keyword: '', currentVehicleType: '', requestedVehicleType: '', applyDateRange: null,
})

// ── 全部记录 ──
const historyLoading = ref(false)
const historyList = ref([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historySize = ref(10)

const historySearch = reactive({
  keyword: '', vehicleType: '', status: undefined, auditDateRange: null,
})

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildPendingParams() {
  const params = { page: pendingPage.value, size: pendingSize.value }
  if (pendingSearch.keyword) params.keyword = pendingSearch.keyword
  if (pendingSearch.currentVehicleType) params.currentVehicleType = pendingSearch.currentVehicleType
  if (pendingSearch.requestedVehicleType) params.requestedVehicleType = pendingSearch.requestedVehicleType
  if (pendingSearch.applyDateRange && pendingSearch.applyDateRange.length === 2) {
    params.applyTimeStart = pendingSearch.applyDateRange[0]
    params.applyTimeEnd = pendingSearch.applyDateRange[1]
  }
  return params
}

function buildHistoryParams() {
  const params = { page: historyPage.value, size: historySize.value }
  if (historySearch.keyword) params.keyword = historySearch.keyword
  if (historySearch.vehicleType) params.vehicleType = historySearch.vehicleType
  if (historySearch.status !== undefined && historySearch.status !== null) params.status = historySearch.status
  if (historySearch.auditDateRange && historySearch.auditDateRange.length === 2) {
    params.auditTimeStart = historySearch.auditDateRange[0]
    params.auditTimeEnd = historySearch.auditDateRange[1]
  }
  return params
}

async function fetchPendingList() {
  pendingLoading.value = true
  try {
    const res = await getPendingVehicleApplications(buildPendingParams())
    pendingList.value = res.records || []
    pendingTotal.value = res.total || 0
  } catch (error) {
    console.error('获取待审核申请失败:', error)
  } finally {
    pendingLoading.value = false
  }
}

function resetPendingSearch() {
  pendingPage.value = 1
  pendingSearch.keyword = ''
  pendingSearch.currentVehicleType = ''
  pendingSearch.requestedVehicleType = ''
  pendingSearch.applyDateRange = null
  fetchPendingList()
}

async function fetchHistoryList() {
  historyLoading.value = true
  try {
    const res = await getAllVehicleApplications(buildHistoryParams())
    historyList.value = res.records || []
    historyTotal.value = res.total || 0
  } catch (error) {
    console.error('获取申请记录失败:', error)
  } finally {
    historyLoading.value = false
  }
}

function resetHistorySearch() {
  historyPage.value = 1
  historySearch.keyword = ''
  historySearch.vehicleType = ''
  historySearch.status = undefined
  historySearch.auditDateRange = null
  fetchHistoryList()
}

function handleHistorySizeChange() {
  historyPage.value = 1
  fetchHistoryList()
}

function handleHistoryPageChange() {
  fetchHistoryList()
}

async function handlePass(row) {
  try {
    await ElMessageBox.confirm(
      `确定通过教练「${row.coachName}」的准教车型变更申请吗？\n将更新为准教车型：${row.requestedVehicleType}`,
      '确认通过',
      { type: 'info' }
    )
    await auditVehicleApplication(row.id, true)
    ElMessage.success('已通过申请')
    fetchPendingList()
    fetchHistoryList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
    }
  }
}

async function handleReject(row) {
  try {
    const { value: auditReason } = await ElMessageBox.prompt(
      `请填写拒绝「${row.coachName}」申请的原因`,
      '拒绝申请',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入拒绝原因',
      }
    )
    if (!auditReason || !auditReason.trim()) {
      ElMessage.warning('拒绝时必须填写原因')
      return
    }
    await auditVehicleApplication(row.id, false, auditReason)
    ElMessage.success('已拒绝申请')
    fetchPendingList()
    fetchHistoryList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
    }
  }
}

onMounted(() => {
  fetchPendingList()
  fetchHistoryList()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 10px;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
