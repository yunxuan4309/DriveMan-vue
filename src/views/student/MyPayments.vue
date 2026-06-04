<template>
  <div class="my-payments">
    <el-card>
      <template #header>
        <span>我的账单</span>
        <el-button text type="primary" @click="fetchRecords" :icon="Refresh">刷新</el-button>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="账单状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已退款" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="filteredList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="业务类型" width="130" align="center">
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
        <el-table-column label="支付时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.payTime ? formatDateTime(row.payTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="退款时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.refundTime ? formatDateTime(row.refundTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
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

      <!-- 统计卡片 -->
      <div class="summary-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="summary-card pending">
              <div class="summary-label">待支付</div>
              <div class="summary-value">¥{{ pendingAmount }}</div>
              <div class="summary-count">{{ pendingCount }} 笔</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card paid">
              <div class="summary-label">已支付</div>
              <div class="summary-value">¥{{ paidAmount }}</div>
              <div class="summary-count">{{ paidCount }} 笔</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card refunded">
              <div class="summary-label">已退款</div>
              <div class="summary-value">¥{{ refundedAmount }}</div>
              <div class="summary-count">{{ refundedCount }} 笔</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card total">
              <div class="summary-label">总计</div>
              <div class="summary-value">¥{{ totalAmount }}</div>
              <div class="summary-count">{{ totalCount }} 笔</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMyPaymentRecords, payMyPaymentRecord, BizType, PaymentStatus } from '@/api/payment'

const recordList = ref([])
const loading = ref(false)

const searchForm = reactive({
  status: undefined,
})

const filteredList = computed(() => {
  if (searchForm.status === undefined || searchForm.status === null) {
    return recordList.value
  }
  return recordList.value.filter(item => item.status === searchForm.status)
})

const pendingList = computed(() => recordList.value.filter(item => item.status === 0))
const paidList = computed(() => recordList.value.filter(item => item.status === 1))
const refundedList = computed(() => recordList.value.filter(item => item.status === 2))

const pendingAmount = computed(() => pendingList.value.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
const paidAmount = computed(() => paidList.value.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
const refundedAmount = computed(() => refundedList.value.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
const totalAmount = computed(() => recordList.value.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))

const pendingCount = computed(() => pendingList.value.length)
const paidCount = computed(() => paidList.value.length)
const refundedCount = computed(() => refundedList.value.length)
const totalCount = computed(() => recordList.value.length)

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

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getMyPaymentRecords()
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取账单失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 筛选通过 computed 自动处理
}

async function handlePay(row) {
  try {
    await ElMessageBox.confirm(
      `确定支付「${getBizTypeText(row.bizType)}」费用 ¥${row.amount} 吗？`,
      '确认支付',
      { type: 'info' }
    )
    await payMyPaymentRecord(row.id)
    ElMessage.success('支付成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败:', error)
    }
  }
}

onMounted(fetchRecords)
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

.summary-cards {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.summary-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  color: #fff;

  .summary-label {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .summary-value {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .summary-count {
    font-size: 12px;
    opacity: 0.9;
  }

  &.pending {
    background: linear-gradient(135deg, #e6a23c, #f56c6c);
  }

  &.paid {
    background: linear-gradient(135deg, #67c23a, #85ce61);
  }

  &.refunded {
    background: linear-gradient(135deg, #909399, #b1b3b8);
  }

  &.total {
    background: linear-gradient(135deg, #409eff, #66b1ff);
  }
}
</style>
