<template>
  <div class="appointment">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>约课管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增约课
          </el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="appointmentList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="coachName" label="教练姓名" width="120" />
        <el-table-column label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '已预约' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cancelReason" label="取消原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.cancelReason">{{ row.cancelReason }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              link type="danger" size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 新增约课对话框 -->
    <el-dialog v-model="dialogVisible" title="新增约课" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="教练" prop="coachId">
          <el-select v-model="form.coachId" placeholder="请选择教练" filterable style="width: 100%">
            <el-option
              v-for="c in coachList"
              :key="c.coachId"
              :label="c.realName + ' (' + c.vehicleType + ')'"
              :value="c.coachId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
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
import { Plus } from '@element-plus/icons-vue'
import { getAppointmentList, createAppointment, cancelAppointment } from '@/api/appointment'
import { getCoachList } from '@/api/coach'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const appointmentList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

const coachList = ref([])

const dialogVisible = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)
const form = reactive({
  coachId: undefined,
  startTime: '',
  endTime: '',
})

const formRules = {
  coachId: [{ required: true, message: '请选择教练', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const cancelDialogVisible = ref(false)
const cancelForm = reactive({ id: undefined, reason: '' })
const cancelLoading = ref(false)

function disabledDate(time) {
  return time.getTime() < Date.now() - 86400000
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAppointmentList({
      page: pagination.page,
      size: pagination.size,
      studentId: userStore.userId,
    })
    appointmentList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取约课列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchCoaches() {
  try {
    const res = await getCoachList()
    coachList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取教练列表失败:', error)
  }
}

function handleAdd() {
  form.coachId = undefined
  form.startTime = ''
  form.endTime = ''
  fetchCoaches()
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await createAppointment({
      studentId: userStore.userId,
      coachId: form.coachId,
      startTime: form.startTime,
      endTime: form.endTime,
    })
    ElMessage.success('约课成功')
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('约课失败:', error)
  } finally {
    submitLoading.value = false
  }
}

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
    fetchList()
  } catch (error) {
    console.error('取消失败:', error)
  } finally {
    cancelLoading.value = false
  }
}

function onSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchList()
}

function onPageChange(page) {
  pagination.page = page
  fetchList()
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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.text-gray { color: #909399; }
</style>
