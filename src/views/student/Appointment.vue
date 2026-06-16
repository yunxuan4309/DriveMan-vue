<template>
  <div class="appointment">
    <!-- 新增约课（基于排班） -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>可约时段</span>
          <el-button text type="primary" @click="fetchAvailableSchedules" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="availableList" v-loading="availLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="车型" width="70" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.licenseType }}</el-tag></template>
        </el-table-column>
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">{{ row.subject ? '科目' + row.subject : '-' }}</template>
        </el-table-column>
        <el-table-column label="开始时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venueName || '-' }}</template>
        </el-table-column>
        <el-table-column label="剩余名额" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.maxStudents - row.bookedCount) > 0 ? 'success' : 'danger'" size="small">
              {{ row.maxStudents - row.bookedCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleBook(row)">约课</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!availLoading && availableList.length === 0" description="暂无可约时段，请确认已绑定教练" style="margin-top: 20px" />
    </el-card>

    <!-- 我的约课记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的约课</span>
          <el-button text type="primary" @click="fetchMyAppointments" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-form :model="filterForm" inline class="search-form">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px" @change="fetchMyAppointments">
            <el-option label="待确认" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="myAppointmentList" v-loading="myLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="coachName" label="教练" width="100" align="center" />
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">{{ row.subject ? '科目' + row.subject : '-' }}</template>
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
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0 || row.status === 1" link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="myTotal > 0">
        <el-pagination v-model:current-page="myPage.page" v-model:page-size="myPage.size" :total="myTotal" layout="total, prev, pager, next" @current-change="fetchMyAppointments" />
      </div>

      <el-empty v-if="!myLoading && myAppointmentList.length === 0" description="暂无约课记录" style="margin-top: 20px" />
    </el-card>

    <!-- 约课对话框 -->
    <el-dialog v-model="bookDialogVisible" title="确认约课" width="450px" destroy-on-close>
      <el-form :model="bookForm" label-width="100px">
        <el-form-item label="教练">
          <span>{{ bookForm.coachName || bookForm.coachId }}</span>
        </el-form-item>
        <el-form-item label="时段">
          <span>{{ formatDateTime(bookForm.startTime) }} ~ {{ formatTime(bookForm.endTime) }}</span>
        </el-form-item>
        <el-form-item label="约课时间" prop="startTime">
          <el-date-picker v-model="bookForm.myStartTime" type="datetime" placeholder="选择上课时间" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="bookForm.myEndTime" type="datetime" placeholder="选择下课时间" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <p style="color: #909399; font-size: 12px; margin: 0">约课时间必须在排班时段范围内（{{ formatDateTime(bookForm.startTime) }} ~ {{ formatTime(bookForm.endTime) }}）</p>
      </el-form>
      <template #footer>
        <el-button @click="bookDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBookSubmit" :loading="bookLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 取消约课对话框 -->
    <el-dialog v-model="cancelDialogVisible" title="取消约课" width="400px" destroy-on-close>
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="原因">
          <el-input v-model="cancelForm.reason" type="textarea" rows="3" placeholder="请输入取消原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleCancelSubmit" :loading="cancelLoading">确定取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getAvailableSchedules,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
} from '@/api/appointment'

const userStore = useUserStore()

// 可约时段
const availableList = ref([])
const availLoading = ref(false)

// 我的约课
const myAppointmentList = ref([])
const myLoading = ref(false)
const myTotal = ref(0)
const myPage = reactive({ page: 1, size: 10 })
const filterForm = reactive({ status: undefined })

// 约课对话框
const bookDialogVisible = ref(false)
const bookForm = reactive({
  scheduleId: null, coachId: null, coachName: '',
  startTime: '', endTime: '',
  myStartTime: '', myEndTime: '',
})
const bookLoading = ref(false)

// 取消对话框
const cancelDialogVisible = ref(false)
const cancelForm = reactive({ id: undefined, reason: '' })
const cancelLoading = ref(false)

// 获取可约排班
async function fetchAvailableSchedules() {
  availLoading.value = true
  try {
    const res = await getAvailableSchedules()
    availableList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取可约时段失败:', error)
    availableList.value = []
  } finally {
    availLoading.value = false
  }
}

// 获取我的约课
async function fetchMyAppointments() {
  myLoading.value = true
  try {
    const params = { page: myPage.page, size: myPage.size }
    if (filterForm.status !== undefined && filterForm.status !== '') params.status = filterForm.status
    const res = await getMyAppointments(params)
    myAppointmentList.value = res.records || []
    myTotal.value = res.total || 0
  } catch (error) {
    console.error('获取约课失败:', error)
  } finally {
    myLoading.value = false
  }
}

// 约课
function handleBook(row) {
  bookForm.scheduleId = row.id
  bookForm.coachId = row.coachId
  bookForm.coachName = row.coachName || ''
  bookForm.startTime = row.startTime
  bookForm.endTime = row.endTime
  bookForm.myStartTime = row.startTime
  bookForm.myEndTime = ''
  bookDialogVisible.value = true
}

async function handleBookSubmit() {
  if (!bookForm.myStartTime || !bookForm.myEndTime) {
    ElMessage.warning('请填写约课时间')
    return
  }
  bookLoading.value = true
  try {
    await createAppointment({
      coachId: bookForm.coachId,
      scheduleId: bookForm.scheduleId,
      startTime: bookForm.myStartTime,
      endTime: bookForm.myEndTime,
    })
    ElMessage.success('约课成功，等待教练确认')
    bookDialogVisible.value = false
    fetchAvailableSchedules()
    fetchMyAppointments()
  } catch (error) {
    console.error('约课失败:', error)
  } finally {
    bookLoading.value = false
  }
}

// 取消约课
function handleCancel(row) {
  cancelForm.id = row.id
  cancelForm.reason = ''
  cancelDialogVisible.value = true
}

async function handleCancelSubmit() {
  cancelLoading.value = true
  try {
    await cancelAppointment(cancelForm.id, cancelForm.reason)
    ElMessage.success('已取消')
    cancelDialogVisible.value = false
    fetchMyAppointments()
    fetchAvailableSchedules()
  } catch (error) {
    console.error('取消失败:', error)
  } finally {
    cancelLoading.value = false
  }
}

function getStatusTag(s) { return { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'info', 4: 'success' }[s] || 'info' }
function getStatusText(s) { return { 0: '待确认', 1: '已确认', 2: '已拒绝', 3: '已取消', 4: '已完成' }[s] || '未知' }
function formatDateTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-' }
function formatTime(dt) { return dt ? new Date(dt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-' }

onMounted(() => {
  fetchAvailableSchedules()
  fetchMyAppointments()
})
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 10px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-gray { color: #909399; }
</style>
