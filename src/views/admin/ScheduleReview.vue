<template>
  <div class="schedule-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="教练姓名">
          <el-input v-model="searchForm.keyword" placeholder="教练姓名" clearable style="width: 130px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plateNumber" placeholder="车牌号" clearable style="width: 120px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="场地">
          <el-input v-model="searchForm.venueName" placeholder="场地名称" clearable style="width: 130px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="申请取消中" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="fetchList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="scheduleList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="教练" width="100" align="center">
          <template #default="{ row }">{{ row.coach_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="车牌号" width="120">
          <template #default="{ row }">{{ row.plate_number || '-' }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venue_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="车型" width="70" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.license_type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="科目" width="70" align="center">
          <template #default="{ row }">
            {{ row.subject ? '科目' + row.subject : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.start_time) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.end_time) }}</template>
        </el-table-column>
        <el-table-column label="名额" width="60" align="center">
          <template #default="{ row }">{{ row.max_students }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请说明" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.apply_reason || '-' }}</template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.audit_remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="success" size="small" @click="handleAudit(row, 1)">通过</el-button>
            <el-button v-if="row.status === 0" type="danger" size="small" @click="handleAudit(row, 2)">拒绝</el-button>
            <el-button v-if="row.status === 5" type="success" size="small" @click="handleCancelAudit(row, true)">同意取消</el-button>
            <el-button v-if="row.status === 5" type="danger" size="small" @click="handleCancelAudit(row, false)">拒绝取消</el-button>
            <span v-if="row.status !== 0 && row.status !== 5" class="no-action">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>

      <el-empty v-if="!loading && scheduleList.length === 0" description="暂无数据" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框（新建审核 / 取消审核 通用） -->
    <el-dialog v-model="dialogVisible" :title="getDialogTitle()" width="450px" destroy-on-close>
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.approved ? 'success' : 'danger'">
            {{ getResultLabel() }}
          </el-tag>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" :placeholder="auditForm.approved ? '可选备注' : '请填写拒绝原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button :type="auditForm.approved ? 'success' : 'danger'" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getAllSchedules, auditSchedule, cancelAuditSchedule } from '@/api/schedule'

const scheduleList = ref([])
const loading = ref(false)
const total = ref(0)

const searchForm = reactive({
  page: 1, size: 10, keyword: '', plateNumber: '', venueName: '',
  licenseType: '', status: undefined, dateRange: null,
})

import { LICENSE_TYPES } from '@/config/license'

const currentId = ref(null)
// auditMode: 'create'=新建排班审核, 'cancel'=取消申请审核
const auditMode = ref('create')
const dialogVisible = ref(false)
const auditForm = reactive({ approved: true, remark: '' })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.plateNumber) params.plateNumber = searchForm.plateNumber
    if (searchForm.venueName) params.venueName = searchForm.venueName
    if (searchForm.licenseType) params.licenseType = searchForm.licenseType
    if (searchForm.status !== undefined && searchForm.status !== null) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDateStart = searchForm.dateRange[0]
      params.startDateEnd = searchForm.dateRange[1]
    }
    const res = await getAllSchedules(params)
    scheduleList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取排班列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.page = 1
  searchForm.keyword = ''
  searchForm.plateNumber = ''
  searchForm.venueName = ''
  searchForm.licenseType = ''
  searchForm.status = undefined
  searchForm.dateRange = null
  fetchList()
}

function handleAudit(row, status) {
  auditMode.value = 'create'
  currentId.value = row.id
  auditForm.approved = status === 1
  auditForm.remark = ''
  dialogVisible.value = true
}

// 审核取消申请
function handleCancelAudit(row, approved) {
  auditMode.value = 'cancel'
  currentId.value = row.id
  auditForm.approved = approved
  auditForm.remark = ''
  dialogVisible.value = true
}

async function handleAuditSubmit() {
  if (!auditForm.approved && !auditForm.remark) {
    ElMessage.warning('拒绝时请填写原因')
    return
  }
  auditLoading.value = true
  try {
    if (auditMode.value === 'cancel') {
      // 取消审核
      await cancelAuditSchedule(currentId.value, auditForm.approved, auditForm.remark)
      ElMessage.success(auditForm.approved ? '已同意取消，关联约课已自动取消' : '已拒绝取消，排班恢复生效')
    } else {
      // 新建审核
      const params = new URLSearchParams()
      params.append('status', auditForm.approved ? 1 : 2)
      if (auditForm.remark) params.append('remark', auditForm.remark)
      await auditSchedule(currentId.value, params)
      ElMessage.success(auditForm.approved ? '已通过' : '已拒绝')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function getDialogTitle() {
  if (auditMode.value === 'cancel') {
    return auditForm.approved ? '同意取消排班' : '拒绝取消申请'
  }
  return auditForm.approved ? '通过排班' : '拒绝排班'
}

function getResultLabel() {
  if (auditMode.value === 'cancel') {
    return auditForm.approved ? '同意取消' : '拒绝取消'
  }
  return auditForm.approved ? '通过' : '拒绝'
}

function getStatusTag(status) {
  return { 0: 'info', 1: 'success', 2: 'danger', 3: '', 4: 'warning', 5: 'danger' }[status] || 'info'
}

function getStatusText(status) {
  return { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '已完成', 4: '已取消', 5: '申请取消中' }[status] || '未知'
}

function formatDateTime(dt) {
  return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 10px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.no-action { color: #ccc; }
</style>
