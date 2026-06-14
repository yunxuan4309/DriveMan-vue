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
        <el-form-item label="培训科目" prop="subject">
          <el-select v-model="applyForm.subject" placeholder="请选择" style="width: 200px">
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
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

      <!-- 筛选栏 -->
      <el-form :model="filterForm" layout="inline" style="margin-bottom: 16px">
        <el-form-item label="培训车型">
          <el-select v-model="filterForm.licenseType" placeholder="全部车型" clearable style="width: 120px" @change="fetchSchedules">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px" @change="fetchSchedules">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="申请取消中" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" @change="fetchSchedules" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="scheduleList" v-loading="scheduleLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="车型" width="70" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.license_type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="科目" width="70" align="center">
          <template #default="{ row }">
            {{ row.subject ? '科目' + row.subject : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="车辆" width="120">
          <template #default="{ row }">{{ row.plate_number || '-' }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venue_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="开始时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.start_time) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.end_time) }}</template>
        </el-table-column>
        <el-table-column label="名额" width="60" align="center">
          <template #default="{ row }">{{ row.booked_count }}/{{ row.max_students }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.audit_remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0 || row.status === 1" link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination
          v-model:current-page="pageInfo.current"
          v-model:page-size="pageInfo.size"
          :total="pageInfo.total"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchSchedules"
          @size-change="fetchSchedules"
        />
      </div>

      <el-empty v-if="!scheduleLoading && scheduleList.length === 0" description="暂无排班记录" style="margin-top: 30px" />
    </el-card>

    <!-- 取消排班对话框 -->
    <el-dialog v-model="cancelDialogVisible" title="取消排班" width="450px" destroy-on-close>
      <div v-if="cancelTarget">
        <p style="margin-bottom: 12px; color: #606266;">
          <template v-if="cancelTarget.status === 1 && cancelTarget.booked_count > 0">
            <el-tag type="warning" size="small">需管理员审核</el-tag>
            该排班已有 <b>{{ cancelTarget.booked_count }}</b> 名学员预约，取消申请将提交管理员审核。
          </template>
          <template v-else>
            确认取消该排班？取消后将立即生效。
          </template>
        </p>
        <el-form label-width="80px">
          <el-form-item label="取消原因">
            <el-input v-model="cancelReason" type="textarea" rows="3"
              :placeholder="cancelTarget.status === 1 && cancelTarget.booked_count > 0 ? '请填写取消原因（必填，将提交管理员审核）' : '请输入取消原因（可选）'" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleCancelSubmit" :loading="cancelLoading">
          {{ cancelTarget && cancelTarget.status === 1 && cancelTarget.booked_count > 0 ? '提交取消申请' : '确定取消' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAvailableVehicles } from '@/api/vehicle'
import { getVenueList } from '@/api/venue'
import { createSchedule, getMySchedules, cancelSchedule } from '@/api/schedule'

const applyFormRef = ref()
const applyForm = reactive({
  vehicleId: null, venueId: null, licenseType: '', subject: null, startTime: '', endTime: '',
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

// 筛选条件
const filterForm = reactive({
  licenseType: '',
  status: null,
  dateRange: null,
})

// 分页信息
const pageInfo = reactive({
  current: 1,
  size: 10,
  total: 0,
})

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
    venueOptions.value = res?.records || []
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
    applyForm.vehicleId = null; applyForm.venueId = null; applyForm.licenseType = ''; applyForm.subject = null
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
    const params = {
      page: pageInfo.current,
      size: pageInfo.size,
    }
    if (filterForm.licenseType) params.licenseType = filterForm.licenseType
    if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status
    if (filterForm.dateRange) {
      params.startDateStart = filterForm.dateRange[0]
      params.startDateEnd = filterForm.dateRange[1]
    }
    const res = await getMySchedules(params)
    scheduleList.value = res?.records || []
    if (res) {
      pageInfo.current = res.current || 1
      pageInfo.size = res.size || 10
      pageInfo.total = res.total || 0
    }
  } catch (error) {
    console.error('获取排班失败:', error)
  } finally {
    scheduleLoading.value = false
  }
}

function resetFilter() {
  filterForm.licenseType = ''
  filterForm.status = null
  filterForm.dateRange = null
  pageInfo.current = 1
  fetchSchedules()
}

// 取消排班 —— 弹出对话框收集取消原因
const cancelDialogVisible = ref(false)
const cancelTarget = ref(null)
const cancelReason = ref('')
const cancelLoading = ref(false)

function handleCancel(row) {
  cancelTarget.value = row
  cancelReason.value = ''
  cancelDialogVisible.value = true
}

async function handleCancelSubmit() {
  const row = cancelTarget.value
  const needAudit = row.status === 1 && row.booked_count > 0

  cancelLoading.value = true
  try {
    await cancelSchedule(row.id, cancelReason.value)
    ElMessage.success(needAudit ? '取消申请已提交，等待管理员审核' : '已取消')
    cancelDialogVisible.value = false
    fetchSchedules()
  } catch (error) {
    console.error('取消失败:', error)
  } finally {
    cancelLoading.value = false
  }
}

function getStatusTag(s) { return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: 'info', 5: 'danger' }[s] || 'info' }
function getStatusText(s) { return { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '已完成', 4: '已取消', 5: '申请取消中' }[s] || '未知' }
function formatDateTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-' }

onMounted(fetchSchedules)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.text-gray { color: #909399; }
</style>
