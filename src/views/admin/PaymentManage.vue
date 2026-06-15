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

      <!-- 欠费搜索栏 -->
      <el-form :model="outstandingSearchForm" inline class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="outstandingSearchForm.keyword" placeholder="学员姓名" clearable style="width: 130px" @keyup.enter="searchOutstanding" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="outstandingSearchForm.phone" placeholder="手机号" clearable style="width: 140px" @keyup.enter="searchOutstanding" />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="outstandingSearchForm.licenseType" placeholder="全部" clearable style="width: 100px" @change="searchOutstanding">
            <el-option v-for="t in licenseTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="outstandingSearchForm.bizType" placeholder="全部" clearable style="width: 120px" @change="searchOutstanding">
            <el-option label="报名费" value="registration_fee" />
            <el-option label="考试费" value="exam_fee" />
            <el-option label="合场费" value="familiarization_fee" />
            <el-option label="二次培训费" value="training_fee" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOutstanding">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetOutstandingSearch">重置</el-button>
        </el-form-item>
      </el-form>

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
            <el-tag size="small" :type="getBizTypeTagType(row.biz_type)">
              {{ getBizTypeText(row.biz_type) }}
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
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handlePay(row)">确认支付</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 欠费分页 -->
      <div class="pagination-wrapper" v-if="outstandingTotal > 0">
        <el-pagination v-model:current-page="outstandingPage" v-model:page-size="outstandingSize" :total="outstandingTotal" layout="total, prev, pager, next" @current-change="fetchOutstanding" />
      </div>
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
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.bizType" placeholder="全部" clearable style="width: 130px" @change="handleSearch">
            <el-option label="报名费" value="registration_fee" />
            <el-option label="考试费" value="exam_fee" />
            <el-option label="合场费" value="familiarization_fee" />
            <el-option label="二次培训费" value="training_fee" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px" @change="handleSearch">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已退款" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.student_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="业务类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getBizTypeTagType(row.biz_type)">
              {{ getBizTypeText(row.biz_type) }}
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
            {{ formatDateTime(row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.pay_time ? formatDateTime(row.pay_time) : '-' }}
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

      <!-- 支付记录分页 -->
      <div class="pagination-wrapper" v-if="recordTotal > 0">
        <el-pagination v-model:current-page="recordPage" v-model:page-size="recordSize" :total="recordTotal" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @size-change="handleSearch" @current-change="fetchList" />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 创建账单对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建账单" width="550px" destroy-on-close>
      <!-- 第一步：搜索并选择学员 -->
      <template v-if="!createForm._selectedStudent">
        <div class="search-student-section">
          <h4 style="margin: 0 0 12px">选择学员</h4>
          <el-form :model="studentSearchForm" inline>
            <el-form-item label="学员姓名">
              <el-input v-model="studentSearchForm.realName" placeholder="输入姓名搜索" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearchStudent" :loading="studentSearchLoading">搜索</el-button>
              <el-button @click="studentSearchForm.realName = ''; studentList = []">清空</el-button>
            </el-form-item>
          </el-form>

          <el-table
            v-if="studentList.length > 0"
            :data="studentList"
            border stripe
            max-height="220"
            highlight-current-row
            @row-click="handleSelectStudent"
          >
            <el-table-column prop="realName" label="姓名" width="100" />
            <el-table-column prop="username" label="账号" width="120" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="licenseType" label="车型" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleSelectStudent(row)">选择</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="studentList.length === 0 && studentSearched" description="未找到匹配的学员" style="margin-top: 10px" />
        </div>
      </template>

      <!-- 第二步：已选择学员，填写账单 -->
      <template v-else>
        <div class="selected-student-info">
          <el-alert :title="`已选择学员：${createForm._selectedStudent.realName || createForm._selectedStudent.username}`" type="success" show-icon :closable="false" style="margin-bottom: 16px">
            <template #description>
              账号：{{ createForm._selectedStudent.username }} | 手机号：{{ createForm._selectedStudent.phone || '-' }} | 车型：{{ createForm._selectedStudent.licenseType || '-' }}
            </template>
          </el-alert>
          <el-button link type="primary" size="small" @click="clearSelectedStudent">重新选择</el-button>
        </div>

        <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px" style="margin-top: 12px">
          <el-form-item label="学员ID">
            <span>{{ createForm.studentId }}</span>
          </el-form-item>
          <el-form-item label="金额" prop="amount">
            <el-input-number v-model="createForm.amount" :precision="2" :min="0" :max="999999" style="width: 100%" />
          </el-form-item>
          <el-form-item label="业务类型" prop="bizType">
            <el-select v-model="createForm.bizType" placeholder="请选择" style="width: 100%">
              <el-option label="报名费" value="registration_fee" />
              <el-option label="考试费" value="exam_fee" />
              <el-option label="合场费" value="familiarization_fee" />
              <el-option label="二次培训费" value="training_fee" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="handleCreateCancel">取消</el-button>
        <el-button v-if="createForm._selectedStudent" type="primary" @click="confirmCreate" :loading="actionLoading">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { getStudentList } from '@/api/student'
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
const outstandingTotal = ref(0)
const outstandingPage = ref(1)
const outstandingSize = ref(10)

const recordList = ref([])
const loading = ref(false)
const recordTotal = ref(0)
const recordPage = ref(1)
const recordSize = ref(10)
const actionLoading = ref(false)

const searchForm = reactive({
  keyword: '',
  bizType: '',
  status: undefined,
})

const outstandingSearchForm = reactive({
  keyword: '',
  phone: '',
  licenseType: '',
  bizType: '',
})

const licenseTypes = ['C1', 'C2', 'C5', 'C6', 'B1', 'B2', 'A1', 'A2', 'A3', 'D', 'E', 'F', 'M', 'N', 'P']

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  studentId: null,
  amount: null,
  bizType: 'other',
  remark: '',
  _selectedStudent: null,
})

const createRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
}

const studentSearchForm = reactive({ realName: '' })
const studentList = ref([])
const studentSearchLoading = ref(false)
const studentSearched = ref(false)

const outstandingCount = computed(() => outstandingTotal.value)

function getBizTypeTagType(bizType) {
  const map = {
    [BizType.REGISTRATION_FEE]: 'success',
    [BizType.EXAM_FEE]: 'warning',
    [BizType.FAMILIARIZATION_FEE]: 'primary',
    [BizType.TRAINING_FEE]: 'warning',
    [BizType.UPGRADE_FEE]: 'primary',
    [BizType.OTHER]: 'info',
  }
  return map[bizType] || 'info'
}

function getBizTypeText(bizType) {
  const map = {
    [BizType.REGISTRATION_FEE]: '报名费',
    [BizType.EXAM_FEE]: '考试费',
    [BizType.FAMILIARIZATION_FEE]: '合场费',
    [BizType.TRAINING_FEE]: '二次培训费',
    [BizType.UPGRADE_FEE]: '增驾费',
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
    const params = { page: outstandingPage.value, size: outstandingSize.value }
    if (outstandingSearchForm.keyword) params.keyword = outstandingSearchForm.keyword
    if (outstandingSearchForm.phone) params.phone = outstandingSearchForm.phone
    if (outstandingSearchForm.licenseType) params.licenseType = outstandingSearchForm.licenseType
    if (outstandingSearchForm.bizType) params.bizType = outstandingSearchForm.bizType
    const res = await getOutstandingPayments(params)
    outstandingList.value = Array.isArray(res) ? res : res.records || []
    outstandingTotal.value = res.total || outstandingList.value.length
  } catch (error) {
    console.error('获取欠费清单失败:', error)
  } finally {
    outstandingLoading.value = false
  }
}

function searchOutstanding() {
  outstandingPage.value = 1
  fetchOutstanding()
}

function resetOutstandingSearch() {
  outstandingSearchForm.keyword = ''
  outstandingSearchForm.phone = ''
  outstandingSearchForm.licenseType = ''
  outstandingSearchForm.bizType = ''
  searchOutstanding()
}

function handleSearch() {
  recordPage.value = 1
  fetchList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.bizType = ''
  searchForm.status = undefined
  handleSearch()
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: recordPage.value, size: recordSize.value }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.bizType) params.bizType = searchForm.bizType
    if (searchForm.status !== undefined && searchForm.status !== null) params.status = searchForm.status

    const res = await getPaymentRecords(params)
    recordList.value = Array.isArray(res) ? res : res.records || []
    recordTotal.value = res.total || recordList.value.length
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
  createForm._selectedStudent = null
  studentSearchForm.realName = ''
  studentList.value = []
  studentSearched.value = false
  createDialogVisible.value = true
}

async function handleSearchStudent() {
  if (!studentSearchForm.realName.trim()) {
    ElMessage.warning('请输入学员姓名')
    return
  }
  studentSearchLoading.value = true
  studentSearched.value = true
  try {
    const res = await getStudentList({ realName: studentSearchForm.realName.trim() })
    studentList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('搜索学员失败:', error)
    studentList.value = []
  } finally {
    studentSearchLoading.value = false
  }
}

function handleSelectStudent(row) {
  createForm.studentId = row.id || row.userId
  createForm._selectedStudent = row
}

function clearSelectedStudent() {
  createForm.studentId = null
  createForm._selectedStudent = null
  studentSearchForm.realName = ''
  studentList.value = []
  studentSearched.value = false
}

function handleCreateCancel() {
  createDialogVisible.value = false
  createForm._selectedStudent = null
}

async function confirmCreate() {
  if (!createForm.studentId) {
    ElMessage.warning('请先选择学员')
    return
  }
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
    createForm._selectedStudent = null
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
      `确定确认支付「${getBizTypeText(row.biz_type)}」¥${row.amount} 吗？`,
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
      `确定退款「${getBizTypeText(row.biz_type)}」¥${row.amount} 吗？`,
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
