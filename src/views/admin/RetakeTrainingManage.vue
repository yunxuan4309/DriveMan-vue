<template>
  <div class="admin-retake-training">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>二次培训管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="待审核" :value="0" />
            <el-option label="培训中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.studentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.subjectName || '科目' + row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="培训状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ row.statusDesc }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否免费" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isFree === 1" type="success" size="small">免费</el-tag>
            <el-tag v-else type="warning" size="small">需缴费</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.isFree === 1">-</span>
            <span v-else style="color: #f56c6c; font-weight: 600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="缴费状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isFree === 1" type="info" size="small">无需缴费</el-tag>
            <el-tag v-else :type="getPayStatusTag(row.payStatus)" size="small">{{ row.payStatusDesc }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请说明" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="handleAudit(row)"
            >审核</el-button>
            <span v-else class="text-gray">-</span>
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

      <el-empty v-if="!loading && recordList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核二次培训申请" width="480px" destroy-on-close>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="学员姓名">
          <span>{{ currentRow?.studentName }}</span>
        </el-form-item>
        <el-form-item label="科目">
          <el-tag size="small" type="primary">{{ currentRow?.subjectName || '科目' + currentRow?.subject }}</el-tag>
        </el-form-item>
        <el-form-item label="申请说明" v-if="currentRow?.applyReason">
          <span style="color: #606266">{{ currentRow.applyReason }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="培训费（元）" v-if="auditForm.pass">
          <el-input-number
            v-model="auditForm.amount"
            :min="0"
            :precision="2"
            :step="50"
            placeholder="默认 300 元"
            style="width: 200px"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">为空则使用系统默认值（300 元）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getAdminRetakeTrainings,
  auditRetakeTraining,
} from '@/api/retakeTraining'

const recordList = ref([])
const loading = ref(false)
const total = ref(0)
const currentRow = ref(null)

const searchForm = reactive({
  page: 1,
  size: 10,
  status: undefined,
})

const auditDialogVisible = ref(false)
const auditForm = reactive({ pass: true, amount: undefined })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.status !== undefined && searchForm.status !== '') {
      params.status = searchForm.status
    }
    const res = await getAdminRetakeTrainings(params)
    if (res && res.records) {
      recordList.value = res.records
      total.value = res.total || 0
    } else if (Array.isArray(res)) {
      recordList.value = res
      total.value = res.length
    } else {
      recordList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取二次培训记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.page = 1
  searchForm.status = undefined
  fetchList()
}

function handleAudit(row) {
  if (row.isFree === 1) {
    ElMessage.warning('全包学员的申请已自动通过，无需审核')
    return
  }
  currentRow.value = row
  auditForm.pass = true
  auditForm.amount = undefined
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  auditLoading.value = true
  try {
    const data = { pass: auditForm.pass }
    if (auditForm.pass && auditForm.amount !== undefined && auditForm.amount !== null) {
      data.amount = auditForm.amount
    }
    await auditRetakeTraining(currentRow.value.id, data)
    ElMessage.success(auditForm.pass ? '审核已通过' : '已拒绝申请')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function getStatusTag(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
  return map[status] || 'info'
}

function getPayStatusTag(payStatus) {
  const map = { 0: 'info', 1: 'danger', 2: 'success' }
  return map[payStatus] || 'info'
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

.text-gray {
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.search-form {
  margin-bottom: 10px;
}
</style>
