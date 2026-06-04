<template>
  <div class="coach-retake-training">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>名下学员二次培训记录</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.studentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="科目" width="90" align="center">
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
        <el-table-column label="申请说明" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.applyReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="150" align="center">
          <template #default="{ row }">
            {{ row.completeTime ? formatDateTime(row.completeTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="handleComplete(row)"
            >完成培训</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无二次培训记录" style="margin-top: 40px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getCoachRetakeTrainings, completeRetakeTraining } from '@/api/retakeTraining'

const recordList = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getCoachRetakeTrainings()
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取培训记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(
      `确定标记学员「${row.studentName}」的二次培训已完成？`,
      '确认',
      { type: 'warning', confirmButtonText: '确定完成' },
    )
    await completeRetakeTraining(row.id)
    ElMessage.success('培训已标记完成')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记失败:', error)
    }
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
</style>
