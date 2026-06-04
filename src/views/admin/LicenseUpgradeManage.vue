<template>
  <div class="admin-license-upgrade">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>增驾申请管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员 ID" width="80" align="center">
          <template #default="{ row }">
            {{ row.studentId || '-' }}
          </template>
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
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="handleAudit(row)"
            >审核</el-button>
            <el-button
              v-if="row.status === 1 && row.examStatus === 0"
              type="success"
              size="small"
              @click="handleRecordExam(row)"
            >录入成绩</el-button>
            <span v-else-if="row.status !== 0" class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无增驾申请" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核增驾申请" width="480px" destroy-on-close>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="学员 ID">
          <span>{{ currentRow?.studentId }}</span>
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
        <el-form-item label="学员 ID">
          <span>{{ currentRow?.studentId }}</span>
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
import { Refresh } from '@element-plus/icons-vue'
import {
  getAllLicenseUpgrades,
  auditLicenseUpgrade,
  setLicenseUpgradeExamResult,
} from '@/api/licenseUpgrade'

const recordList = ref([])
const loading = ref(false)
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
    const res = await getAllLicenseUpgrades()
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取增驾记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
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

.text-gray {
  color: #909399;
}
</style>
