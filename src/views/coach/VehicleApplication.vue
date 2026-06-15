<template>
  <div class="vehicle-application">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>准教车型变更申请</span>
        </div>
      </template>

      <!-- 当前车型信息 -->
      <el-descriptions :column="2" border style="margin-bottom: 20px">
        <el-descriptions-item label="当前准教车型">
          <el-tag type="primary">{{ currentVehicleType || '加载中...' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请状态">
          <span v-if="pendingApplication">
            <el-tag type="warning">有待审核申请</el-tag>
          </span>
          <span v-else>
            <el-tag type="success">可申请</el-tag>
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 申请表单 -->
      <el-form :model="applyForm" :rules="rules" ref="formRef" label-width="120px" class="apply-form">
        <el-form-item label="申请车型" prop="requestedVehicleType">
          <el-checkbox-group v-model="applyForm.requestedVehicleType">
            <el-checkbox v-for="type in availableVehicleTypes" :key="type" :label="type">
              {{ type }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="form-tip">可多选</div>
        </el-form-item>
        <el-form-item label="申请理由" prop="applyReason">
          <el-input
            v-model="applyForm.applyReason"
            type="textarea"
            :rows="3"
            placeholder="请输入申请理由，如：已取得 C2 教练资格证"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!!pendingApplication || applyForm.requestedVehicleType.length === 0"
            @click="handleSubmit"
          >
            提交申请
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 申请记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>我的申请记录</span>
      </template>
      <el-table :data="applicationList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="当前车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.currentVehicleType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请车型" min-width="120" align="center">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCoachRating, submitVehicleApplication, getCoachVehicleApplications } from '@/api/coach'

const formRef = ref(null)
const submitting = ref(false)
const loading = ref(false)
const currentVehicleType = ref('')
const applicationList = ref([])

const licenseTypes = ['C1', 'C2', 'C5', 'C6', 'B1', 'B2', 'A1', 'A2', 'A3', 'D', 'E', 'F', 'M', 'N', 'P']
const availableVehicleTypes = licenseTypes

const applyForm = reactive({
  requestedVehicleType: [],
  applyReason: '',
})

const rules = {
  requestedVehicleType: [
    { required: true, message: '请选择申请车型', trigger: 'change' },
  ],
}

const pendingApplication = computed(() => {
  return applicationList.value.find(item => item.status === 0)
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

async function fetchCoachInfo() {
  try {
    const res = await getCoachRating()
    currentVehicleType.value = res.vehicleType || res.vehicle_type || ''
  } catch (error) {
    console.error('获取教练信息失败:', error)
  }
}

async function fetchApplications() {
  loading.value = true
  try {
    const res = await getCoachVehicleApplications()
    applicationList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取申请记录失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 检查是否包含当前车型
  const selectedTypes = applyForm.requestedVehicleType.join(',')
  if (currentVehicleType.value && selectedTypes === currentVehicleType.value) {
    ElMessage.warning('申请车型与当前准教车型一致，无需变更')
    return
  }

  try {
    await ElMessageBox.confirm('确定提交准教车型变更申请吗？', '确认提交', { type: 'info' })
    submitting.value = true
    await submitVehicleApplication(selectedTypes, applyForm.applyReason)
    ElMessage.success('申请提交成功，等待管理员审核')
    applyForm.requestedVehicleType = []
    applyForm.applyReason = ''
    fetchApplications()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCoachInfo()
  fetchApplications()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.apply-form {
  max-width: 600px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
