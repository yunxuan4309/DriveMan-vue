<template>
  <div class="payment-manage">
    <!-- 欠费清单 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>欠费清单</span>
          <el-tag type="danger" v-if="outstandingCount > 0">{{ outstandingCount }} 笔待支付</el-tag>
        </div>
      </template>
      <el-table :data="outstandingList" v-loading="outstandingLoading" border stripe max-height="300">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.student_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="120" align="center">
          <template #default="{ row }">
            {{ row.student_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报考车型" width="80" align="center">
          <template #default="{ row }">
            {{ row.license_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="业务类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getBizTypeTagType(row.bizType)">
              {{ getBizTypeText(row.bizType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handlePay(row)">确认支付</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 全部支付记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>支付记录管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>创建账单
            </el-button>
            <el-button text type="primary" @click="fetchList">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.bizType" placeholder="全部" clearable style="width: 140px" @change="fetchList">
            <el-option label="报名费" value="registration_fee" />
            <el-option label="考试费" value="exam_fee" />
            <el-option label="合场费" value="familiarization_fee" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已退款" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员ID" width="80" align="center">
          <template #default="{ row }">
            {{ row.studentId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="业务类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getBizTypeTagType(row.bizType)">
              {{ getBizTypeText(row.bizType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.payTime ? formatDateTime(row.payTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="handlePay(row)"
            >
              确认支付
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              size="small"
              @click="handleRefund(row)"
            >
              退款
            </el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建账单对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建账单" width="450px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="学员ID" prop="studentId">
          <el-input-number v-model="createForm.studentId" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="createForm.amount" :precision="2" :min="0" :max="999999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="业务类型" prop="bizType">
          <el-select v-model="createForm.bizType" placeholder="请选择" style="width: 100%">
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :loading="actionLoading">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  getMyPaymentRecords,
  createPaymentRecord,
  getPaymentRecords,
  confirmPayment,
  refundPayment,
  getOutstandingPayments,
  BizType,
  PaymentStatus,
} from '@/api/payment'

const outstandingList = ref([])
const outstandingLoading = ref(false)
const recordList = ref([])
const loading = ref(false)
const actionLoading = ref(false)

const searchForm = reactive({
  bizType: '',
  status: undefined,
})

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  studentId: null,
  amount: null,
  bizType: 'other',
  remark: '',
})

const createRules = {
  studentId: [{ required: true, message: '请输入学员ID', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
}

const outstandingCount = computed(() => outstandingList.value.length)

function getBizTypeTagType(bizType) {
  const map = {
    [BizType.REGISTRATION_FEE]: 'success',
    [BizType.EXAM_FEE]: 'warning',
    [BizType.FAMILIARIZATION_FEE]: 'primary',
    [BizType.OTHER]: 'info',
  }
  return map[bizType] || 'info'
}

function getBizTypeText(bizType) {
  const map = {
    [BizType.REGISTRATION_FEE]: '报名费',
    [BizType.EXAM_FEE]: '考试费',
    [BizType.FAMILIARIZATION_FEE]: '合场费',
    [BizType.OTHER]: '其他',
  }
  return map[bizType] || bizType || '未知'
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待支付', 1: '已支付', 2: '已退款' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

async function fetchOutstanding() {
  outstandingLoading.value = true
  try {
    const res = await getOutstandingPayments()
    outstandingList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取欠费清单失败:', error)
  } finally {
    outstandingLoading.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params = {}
    if (searchForm.bizType) params.bizType = searchForm.bizType
    if (searchForm.status !== undefined && searchForm.status !== null) params.status = searchForm.status

    const res = await getPaymentRecords(params)
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取支付记录失败:', error)
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  createForm.studentId = null
  createForm.amount = null
  createForm.bizType = 'other'
  createForm.remark = ''
  createDialogVisible.value = true
}

async function confirmCreate() {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  actionLoading.value = true
  try {
    await createPaymentRecord({
      studentId: createForm.studentId,
      amount: createForm.amount,
      bizType: createForm.bizType,
      remark: createForm.remark,
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    fetchList()
    fetchOutstanding()
  } catch (error) {
    console.error('创建失败:', error)
  } finally {
    actionLoading.value = false
  }
}

async function handlePay(row) {
  try {
    await ElMessageBox.confirm(
      `确定确认支付「${getBizTypeText(row.bizType)}」¥${row.amount} 吗？`,
      '确认支付',
      { type: 'info' }
    )
    await confirmPayment(row.id)
    ElMessage.success('支付成功')
    fetchList()
    fetchOutstanding()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败:', error)
    }
  }
}

async function handleRefund(row) {
  try {
    await ElMessageBox.confirm(
      `确定退款「${getBizTypeText(row.bizType)}」¥${row.amount} 吗？`,
      '确认退款',
      { type: 'warning' }
    )
    await refundPayment(row.id)
    ElMessage.success('退款成功')
    fetchList()
    fetchOutstanding()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退款失败:', error)
    }
  }
}

onMounted(() => {
  fetchOutstanding()
  fetchList()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.text-gray {
  color: #909399;
}
</style>
