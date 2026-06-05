<template>
  <div class="coach-schedule">
    <!-- 提交排班申请 -->
    <el-card>
      <template #header>
        <span>提交排班申请</span>
      </template>
      <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="120px">
        <el-form-item label="培训车型" prop="licenseType">
          <el-select v-model="applyForm.licenseType" placeholder="请选择" style="width: 200px">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆" prop="vehicleId">
          <el-select v-model="applyForm.vehicleId" placeholder="请先选择车型" style="width: 100%" @focus="fetchAvailableVehicles">
            <el-option v-for="v in vehicleOptions" :key="v.id" :label="`${v.plateNumber} (${v.brand} ${v.model})`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="训练场地" prop="venueId">
          <el-select v-model="applyForm.venueId" placeholder="请选择" style="width: 100%" @focus="fetchVenues">
            <el-option v-for="v in venueOptions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="applyForm.startTime" type="datetime" placeholder="选择开始时间" value-format="YYYY-MM-DDTHH:mm:ss" :disabled-date="d => d <= new Date()" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="applyForm.endTime" type="datetime" placeholder="选择结束时间" value-format="YYYY-MM-DDTHH:mm:ss" :disabled-date="d => d <= new Date()" style="width: 100%" />
        </el-form-item>
        <el-form-item label="容纳学员数">
          <el-input-number v-model="applyForm.maxStudents" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="申请说明">
          <el-input v-model="applyForm.applyReason" type="textarea" rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleApply" :loading="applyLoading">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的排班记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>我的排班记录</span>
          <el-button text type="primary" @click="fetchSchedules" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="scheduleList" v-loading="scheduleLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="车型" width="70" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.licenseType }}</el-tag></template>
        </el-table-column>
        <el-table-column label="车辆" width="120">
          <template #default="{ row }">{{ row.plateNumber || '-' }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venueName || '-' }}</template>
        </el-table-column>
        <el-table-column label="开始时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="名额" width="60" align="center">
          <template #default="{ row }">{{ row.bookedCount }}/{{ row.maxStudents }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditRemark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0 || row.status === 1" link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!scheduleLoading && scheduleList.length === 0" description="暂无排班记录" style="margin-top: 30px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAvailableVehicles } from '@/api/vehicle'
import { getVenueList } from '@/api/venue'
import { createSchedule, getMySchedules, cancelSchedule } from '@/api/schedule'

const applyFormRef = ref()
const applyForm = reactive({
  vehicleId: null, venueId: null, licenseType: '', startTime: '', endTime: '',
  maxStudents: 1, applyReason: '',
})
const applyRules = {
  licenseType: [{ required: true, message: '请选择培训车型', trigger: 'change' }],
  vehicleId: [{ required: true, message: '请选择车辆', trigger: 'change' }],
  venueId: [{ required: true, message: '请选择训练场地', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}
const applyLoading = ref(false)

const vehicleOptions = ref([])
const venueOptions = ref([])

const scheduleList = ref([])
const scheduleLoading = ref(false)

async function fetchAvailableVehicles() {
  try {
    const params = {}
    if (applyForm.licenseType) params.vehicleType = applyForm.licenseType
    const res = await getAvailableVehicles(params)
    vehicleOptions.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取可用车辆失败:', error)
  }
}

async function fetchVenues() {
  try {
    const res = await getVenueList({ venueType: 2 })
    venueOptions.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取场地失败:', error)
  }
}

async function handleApply() {
  const valid = await applyFormRef.value?.validate().catch(() => false)
  if (!valid) return
  applyLoading.value = true
  try {
    await createSchedule(applyForm)
    ElMessage.success('排班申请已提交，等待管理员审批')
    applyForm.vehicleId = null; applyForm.venueId = null; applyForm.licenseType = ''
    applyForm.startTime = ''; applyForm.endTime = ''; applyForm.maxStudents = 1; applyForm.applyReason = ''
    fetchSchedules()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    applyLoading.value = false
  }
}

async function fetchSchedules() {
  scheduleLoading.value = true
  try {
    const res = await getMySchedules()
    scheduleList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取排班失败:', error)
  } finally {
    scheduleLoading.value = false
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定取消该排班？', '确认', { type: 'warning' })
    await cancelSchedule(row.id)
    ElMessage.success('已取消')
    fetchSchedules()
  } catch (error) {
    if (error !== 'cancel') console.error('取消失败:', error)
  }
}

function getStatusTag(s) { return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: 'info' }[s] || 'info' }
function getStatusText(s) { return { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '已完成', 4: '已取消' }[s] || '未知' }
function formatDateTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-' }

onMounted(fetchSchedules)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.text-gray { color: #909399; }
</style>
