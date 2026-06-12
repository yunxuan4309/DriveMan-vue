<template>
  <div class="admin-license-upgrade">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>增驾申请管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="学员姓名" clearable style="width: 130px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="原车型">
          <el-select v-model="searchForm.originalLicense" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="A3" value="A3" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标车型">
          <el-select v-model="searchForm.targetLicense" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="A3" value="A3" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px" @change="fetchList">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核不通过" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试状态">
          <el-select v-model="searchForm.examStatus" placeholder="全部" clearable style="width: 110px" @change="fetchList">
            <el-option label="待考试" :value="0" />
            <el-option label="考试通过" :value="1" />
            <el-option label="考试不通过" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 220px"
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

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">{{ row.studentName || '-' }}</template>
        </el-table-column>
        <el-table-column label="原车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.originalLicense || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.targetLicense || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="增驾类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.upgradeType === 1" size="small" type="success">同级增驾</el-tag>
            <el-tag v-else size="small" type="warning">升级增驾</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" :type="getExamStatusTag(row.examStatus)" size="small">
              {{ getExamStatusText(row.examStatus) }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary" size="small" @click="handleAudit(row)">审核</el-button>
            <el-button
              v-if="row.status === 1 && row.examStatus === 0"
              type="success" size="small" @click="handleRecordExam(row)">录入成绩</el-button>
            <span v-else-if="row.status !== 0" class="text-gray">-</span>
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
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无增驾申请" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核增驾申请" width="480px" destroy-on-close>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="学员姓名">
          <span>{{ currentRow?.studentName }}</span>
        </el-form-item>
        <el-form-item label="增驾信息">
          <span>{{ currentRow?.originalLicense }} → {{ currentRow?.targetLicense }}</span>
        </el-form-item>
        <el-form-item label="增驾类型">
          <el-tag v-if="currentRow?.upgradeType === 1" size="small" type="success">同级增驾</el-tag>
          <el-tag v-else size="small" type="warning">升级增驾</el-tag>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" :placeholder="auditForm.status === 2 ? '请填写不通过原因' : '可选备注'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 录入考试成绩对话框 -->
    <el-dialog v-model="examDialogVisible" title="录入增驾考试成绩" width="450px" destroy-on-close>
      <el-form :model="examForm" label-width="100px">
        <el-form-item label="学员姓名">
          <span>{{ currentRow?.studentName }}</span>
        </el-form-item>
        <el-form-item label="增驾信息">
          <span>{{ currentRow?.originalLicense }} → {{ currentRow?.targetLicense }}</span>
        </el-form-item>
        <el-form-item label="考试结果">
          <el-radio-group v-model="examForm.examStatus">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="examForm.examRemark" type="textarea" rows="3" :placeholder="examForm.examStatus === 2 ? '请填写不通过原因' : '可选备注'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExamSubmit" :loading="examLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import {
  getAllLicenseUpgrades,
  auditLicenseUpgrade,
  setLicenseUpgradeExamResult,
} from '@/api/licenseUpgrade'

const recordList = ref([])
const loading = ref(false)
const total = ref(0)

const searchForm = reactive({
  page: 1, size: 10, keyword: '', originalLicense: '', targetLicense: '',
  status: undefined, examStatus: undefined, dateRange: null,
})

const currentRow = ref(null)

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({ status: 1, remark: '' })
const auditLoading = ref(false)

// 录入考试成绩
const examDialogVisible = ref(false)
const examForm = reactive({ examStatus: 1, examRemark: '' })
const examLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.originalLicense) params.originalLicense = searchForm.originalLicense
    if (searchForm.targetLicense) params.targetLicense = searchForm.targetLicense
    if (searchForm.status !== undefined && searchForm.status !== null) params.status = searchForm.status
    if (searchForm.examStatus !== undefined && searchForm.examStatus !== null) params.examStatus = searchForm.examStatus
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.createTimeStart = searchForm.dateRange[0]
      params.createTimeEnd = searchForm.dateRange[1]
    }
    const res = await getAllLicenseUpgrades(params)
    recordList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取增驾记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.page = 1
  searchForm.keyword = ''
  searchForm.originalLicense = ''
  searchForm.targetLicense = ''
  searchForm.status = undefined
  searchForm.examStatus = undefined
  searchForm.dateRange = null
  fetchList()
}

function handleSizeChange() {
  searchForm.page = 1
  fetchList()
}

function handleAudit(row) {
  currentRow.value = row
  auditForm.status = 1
  auditForm.remark = ''
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('审核不通过时请填写备注原因')
    return
  }
  auditLoading.value = true
  try {
    const data = { status: auditForm.status }
    if (auditForm.remark) data.remark = auditForm.remark
    await auditLicenseUpgrade(currentRow.value.id, data)
    ElMessage.success(auditForm.status === 1 ? '审核已通过' : '已拒绝申请')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function handleRecordExam(row) {
  currentRow.value = row
  examForm.examStatus = 1
  examForm.examRemark = ''
  examDialogVisible.value = true
}

async function handleExamSubmit() {
  examLoading.value = true
  try {
    const data = { examStatus: examForm.examStatus }
    if (examForm.examRemark) data.examRemark = examForm.examRemark
    await setLicenseUpgradeExamResult(currentRow.value.id, data)
    ElMessage.success(examForm.examStatus === 1 ? '考试成绩已录入，学员准驾车型已更新' : '已记录考试不通过')
    examDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('录入失败:', error)
  } finally {
    examLoading.value = false
  }
}

function getStatusTag(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过' }
  return map[status] || '未知'
}

function getExamStatusTag(examStatus) {
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[examStatus] || 'info'
}

function getExamStatusText(examStatus) {
  const map = { 0: '待考试', 1: '考试通过', 2: '考试不通过' }
  return map[examStatus] || '-'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchList)
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
.text-gray {
  color: #909399;
}
</style>
