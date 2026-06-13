<template>
  <div class="my-courses">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的课程</span>
          <el-button text type="primary" @click="onTabChange" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="待确认" name="pending" />
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="排班概览" name="schedules" />
      </el-tabs>

      <!-- 约课表格（待确认 / 全部） -->
      <template v-if="activeTab !== 'schedules'">
        <el-table :data="courseList" v-loading="loading" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentName" label="学员" width="100" align="center">
            <template #default="{ row }">{{ row.studentName || '未知' }}</template>
          </el-table-column>
          <el-table-column label="时间" min-width="240">
            <template #default="{ row }">
              {{ formatDateTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="取消原因" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ row.cancelReason || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="150" align="center">
            <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right" align="center">
            <template #default="{ row }">
              <el-button v-if="row.status === 0" type="success" size="small" @click="handleConfirm(row)">确认</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
              <el-button v-if="row.status === 1" type="warning" size="small" @click="handleRecordHours(row)">录入学时</el-button>
              <el-button v-if="row.status === 1" type="primary" size="small" @click="handleComplete(row)">完成</el-button>
              <span v-else-if="![0, 1].includes(row.status)" class="text-gray">-</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
            :total="total" layout="total, prev, pager, next" @current-change="fetchList" />
        </div>

        <el-empty v-if="!loading && courseList.length === 0" description="暂无课程" style="margin-top: 30px" />
      </template>

      <!-- 排班概览表格 -->
      <template v-if="activeTab === 'schedules'">
        <el-table :data="scheduleList" v-loading="scheduleLoading" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="车型" width="70" align="center">
            <template #default="{ row }"><el-tag size="small">{{ row.licenseType }}</el-tag></template>
          </el-table-column>
          <el-table-column label="车辆" width="120">
            <template #default="{ row }">{{ row.plateNumber || '-' }}</template>
          </el-table-column>
          <el-table-column label="场地" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">{{ row.venueName || '-' }}</template>
          </el-table-column>
          <el-table-column label="时间" min-width="240">
            <template #default="{ row }">
              {{ formatDateTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="名额" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(row.maxStudents - row.bookedCount) > 0 ? 'success' : 'danger'" size="small">
                {{ row.bookedCount }}/{{ row.maxStudents }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="预约学员" min-width="160">
            <template #default="{ row }">
              <span v-if="row.appointments && row.appointments.length > 0">
                <el-tag v-for="b in row.appointments" :key="b.appointmentId" size="small"
                  style="margin: 2px 4px 2px 0" :type="getBookingTag(b.status)">
                  {{ b.studentName || '未知' }}
                </el-tag>
              </span>
              <span v-else class="text-gray">暂无预约</span>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!scheduleLoading && scheduleList.length === 0" description="暂无已通过排班" style="margin-top: 30px" />
      </template>
    </el-card>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝约课" width="400px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleRejectSubmit" :loading="rejectLoading">确定拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 录入学时对话框 -->
    <el-dialog v-model="hoursDialogVisible" title="录入学时" width="420px" destroy-on-close>
      <el-form :model="hoursForm" label-width="100px">
        <el-form-item label="学员">
          <span>{{ hoursForm.studentName || '-' }}</span>
        </el-form-item>
        <el-form-item label="科目">
          <span>{{ subjectLabel(hoursForm.subjectType) }}</span>
        </el-form-item>
        <el-form-item label="培训车型">
          <span>{{ hoursForm.licenseType || '-' }}</span>
        </el-form-item>
        <el-form-item label="本次学时（小时）" prop="duration">
          <el-input-number v-model="hoursForm.duration" :min="0.5" :max="hoursForm.maxHours" :step="0.5" :precision="1" style="width: 200px" />
          <span style="margin-left: 8px; font-size: 12px; color: #909399">剩余可录 {{ hoursForm.maxHours }}h</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="hoursForm.remark" type="textarea" rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="hoursDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleHoursSubmit" :loading="hoursLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  confirmAppointment, rejectAppointment, completeAppointment,
  getPendingAppointments, getCoachAppointments, getApprovedSchedules,
  createTrainingRecord,
} from '@/api/appointment'

const activeTab = ref('pending')
const courseList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })

// 排班概览
const scheduleList = ref([])
const scheduleLoading = ref(false)

// 拒绝
const rejectDialogVisible = ref(false)
const rejectForm = reactive({ id: null, reason: '' })
const rejectLoading = ref(false)
const rejectTargetId = ref(null)

// 录入学时
const hoursDialogVisible = ref(false)
const hoursForm = reactive({
  studentId: null,
  studentName: '',
  subjectType: 2,
  licenseType: '',
  duration: 2,
  maxHours: 8,
  remark: '',
  appointmentId: null,
})
const hoursLoading = ref(false)

function onTabChange() {
  if (activeTab.value === 'schedules') {
    fetchApprovedSchedules()
  } else {
    fetchList()
  }
}

async function fetchApprovedSchedules() {
  scheduleLoading.value = true
  try {
    const res = await getApprovedSchedules()
    scheduleList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取排班概览失败:', error)
  } finally {
    scheduleLoading.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    if (activeTab.value === 'pending') {
      const res = await getPendingAppointments()
      courseList.value = Array.isArray(res) ? res : []
      total.value = courseList.value.length
    } else {
      const res = await getCoachAppointments({ page: pagination.page, size: pagination.size })
      courseList.value = res.records || []
      total.value = res.total || 0
    }
  } catch (error) {
    console.error('获取课程失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleConfirm(row) {
  try {
    await ElMessageBox.confirm(`确认学员「${row.studentName}」的约课？`, '确认', { type: 'info' })
    await confirmAppointment(row.id)
    ElMessage.success('已确认')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') console.error('确认失败:', error)
  }
}

function handleReject(row) {
  rejectTargetId.value = row.id
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

async function handleRejectSubmit() {
  if (!rejectForm.reason) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  rejectLoading.value = true
  try {
    await rejectAppointment(rejectTargetId.value, rejectForm.reason)
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('拒绝失败:', error)
  } finally {
    rejectLoading.value = false
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(`确认学员「${row.studentName}」的课程已完成？`, '确认', { type: 'success' })
    await completeAppointment(row.id)
    ElMessage.success('已完成')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') console.error('完成失败:', error)
  }
}

function handleRecordHours(row) {
  hoursForm.studentId = row.studentId
  hoursForm.studentName = row.studentName || ''
  hoursForm.subjectType = row.subject || 2
  hoursForm.licenseType = row.licenseType || ''
  hoursForm.remark = ''
  hoursForm.appointmentId = row.id
  // 计算剩余可录时长 = 课程总时长 - 已录累计学时
  let totalH = 8
  if (row.startTime && row.endTime) {
    const diffMs = new Date(row.endTime) - new Date(row.startTime)
    totalH = Math.max(0.5, Math.round(diffMs / (1000 * 60 * 60) * 10) / 10)
  }
  const alreadyH = Number(row.alreadyRecordedHours) || 0
  const remainingH = Math.max(0.5, Math.round((totalH - alreadyH) * 10) / 10)
  hoursForm.maxHours = remainingH
  hoursForm.duration = Math.min(2, remainingH)
  hoursDialogVisible.value = true
}

async function handleHoursSubmit() {
  if (!hoursForm.duration || hoursForm.duration <= 0) {
    ElMessage.warning('请输入有效的学时')
    return
  }
  hoursLoading.value = true
  try {
    await createTrainingRecord({
      studentId: hoursForm.studentId,
      subjectType: hoursForm.subjectType,
      licenseType: hoursForm.licenseType,
      duration: hoursForm.duration,
      remark: hoursForm.remark,
      appointmentId: hoursForm.appointmentId,
    })
    ElMessage.success('学时已录入')
    hoursDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('录入学时失败:', error)
  } finally {
    hoursLoading.value = false
  }
}

function subjectLabel(s) { return { 2: '科目二', 3: '科目三' }[s] || '科目' + s }
function getStatusTag(s) { return { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'info', 4: 'success' }[s] || 'info' }
function getStatusText(s) { return { 0: '待确认', 1: '已确认', 2: '已拒绝', 3: '已取消', 4: '已完成' }[s] || '未知' }
function getBookingTag(s) { return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: '' }[s] || 'info' }
function formatDateTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-' }
function formatTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-' }

onMounted(fetchList)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 16px; }
.text-gray { color: #909399; }
</style>
