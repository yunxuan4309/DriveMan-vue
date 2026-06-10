<template>
  <div class="vehicle-application-review">
    <!-- 待审核申请 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>待审核申请</span>
          <el-tag type="warning">{{ pendingList.length }} 条</el-tag>
        </div>
      </template>
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
    </el-card>

    <!-- 全部申请记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>全部申请记录</span>
          <div class="header-right" style="display: flex; gap: 8px">
            <el-input v-model="searchKeyword" placeholder="教练姓名" clearable style="width: 130px" @keyup.enter="handleFilterChange" />
            <el-select v-model="searchVehicleType" placeholder="申请车型" clearable style="width: 120px" @change="handleFilterChange">
              <el-option label="C1" value="C1" />
              <el-option label="C2" value="C2" />
              <el-option label="B1" value="B1" />
              <el-option label="B2" value="B2" />
              <el-option label="A1" value="A1" />
              <el-option label="A2" value="A2" />
              <el-option label="A3" value="A3" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 120px" @change="handleFilterChange">
              <el-option label="待审核" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已拒绝" :value="2" />
            </el-select>
          </div>
        </div>
      </template>
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
        <el-table-column label="状态" width="100" align="center">
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
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingVehicleApplications, getAllVehicleApplications, auditVehicleApplication } from '@/api/admin'

const pendingLoading = ref(false)
const historyLoading = ref(false)
const pendingList = ref([])
const historyList = ref([])
const filterStatus = ref()
const searchKeyword = ref('')
const searchVehicleType = ref('')

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
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

async function fetchPendingList() {
  pendingLoading.value = true
  try {
    const res = await getPendingVehicleApplications()
    pendingList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取待审核申请失败:', error)
  } finally {
    pendingLoading.value = false
  }
}

async function fetchHistoryList() {
  historyLoading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (filterStatus.value !== undefined && filterStatus.value !== null) {
      params.status = filterStatus.value
    }
    if (searchKeyword.value) params.coachName = searchKeyword.value
    if (searchVehicleType.value) params.vehicleType = searchVehicleType.value
    const res = await getAllVehicleApplications(params)
    if (res && res.records) {
      historyList.value = res.records
      pagination.total = res.total || 0
    } else if (Array.isArray(res)) {
      historyList.value = res
      pagination.total = res.length
    } else {
      historyList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取申请记录失败:', error)
  } finally {
    historyLoading.value = false
  }
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

function handleSizeChange() {
  pagination.page = 1
  fetchHistoryList()
}

function handlePageChange() {
  fetchHistoryList()
}

function handleFilterChange() {
  pagination.page = 1
  fetchHistoryList()
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
