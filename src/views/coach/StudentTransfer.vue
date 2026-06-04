<template>
  <div class="student-transfer">
    <!-- 我的学员列表 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>我的学员</span>
      </template>
      <el-table :data="studentList" v-loading="studentLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="120" align="center">
          <template #default="{ row }">
            {{ row.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="120" align="center">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报考车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="handleTransfer(row)">
              移交
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 移交申请记录 -->
    <el-card>
      <template #header>
        <span>移交申请记录</span>
        <el-button text type="primary" @click="fetchTransferRecords" :icon="Refresh">刷新</el-button>
      </template>
      <el-table :data="transferList" v-loading="transferLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.studentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="目标教练" width="100" align="center">
          <template #default="{ row }">
            {{ row.targetCoachName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="移交原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.transferReason || '-' }}
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

    <!-- 移交对话框 -->
    <el-dialog v-model="transferDialogVisible" title="移交学员" width="500px" destroy-on-close>
      <el-form :model="transferForm" :rules="transferRules" ref="transferFormRef" label-width="100px">
        <el-form-item label="学员">
          <el-input :value="transferForm.studentName" disabled />
        </el-form-item>
        <el-form-item label="目标教练" prop="targetCoachId">
          <el-select v-model="transferForm.targetCoachId" placeholder="请选择接收教练" filterable style="width: 100%">
            <el-option
              v-for="c in coachList"
              :key="c.coachId"
              :label="(c.realName || '教练') + ' (' + c.vehicleType + ')'"
              :value="c.coachId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="移交原因" prop="reason">
          <el-input
            v-model="transferForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入移交原因（如：因身体原因无法继续带教）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferSubmit" :loading="submitLoading">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMyStudents, getCoachList, applyStudentTransfer, getCoachTransferRecords, getCoachRating } from '@/api/coach'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const studentLoading = ref(false)
const transferLoading = ref(false)
const submitLoading = ref(false)
const studentList = ref([])
const coachList = ref([])
const transferList = ref([])

// 移交相关
const transferDialogVisible = ref(false)
const transferFormRef = ref(null)
const transferForm = reactive({
  studentId: null,
  studentName: '',
  targetCoachId: null,
  reason: '',
})
const transferRules = {
  targetCoachId: [{ required: true, message: '请选择接收教练', trigger: 'change' }],
  reason: [{ required: true, message: '请输入移交原因', trigger: 'blur' }],
}

// 当前教练ID（仅用于过滤目标教练列表）
let currentCoachId = null

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

async function fetchMyStudents() {
  studentLoading.value = true
  try {
    const res = await getMyStudents()
    if (res && res.students) {
      studentList.value = res.students
    } else if (Array.isArray(res)) {
      studentList.value = res
    } else {
      studentList.value = []
    }
  } catch (error) {
    console.error('获取学员列表失败:', error)
    studentList.value = []
  } finally {
    studentLoading.value = false
  }
}

async function fetchCoaches() {
  try {
    const res = await getCoachList()
    let list = Array.isArray(res) ? res : res.records || []
    // 过滤掉自己
    if (currentCoachId) {
      list = list.filter(c => c.coachId !== currentCoachId)
    }
    coachList.value = list
  } catch (error) {
    console.error('获取教练列表失败:', error)
    coachList.value = []
  }
}

async function fetchTransferRecords() {
  transferLoading.value = true
  try {
    const res = await getCoachTransferRecords()
    transferList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取移交记录失败:', error)
  } finally {
    transferLoading.value = false
  }
}

function handleTransfer(row) {
  transferForm.studentId = row.studentId
  transferForm.studentName = row.realName
  transferForm.targetCoachId = null
  transferForm.reason = ''
  transferDialogVisible.value = true
}

async function handleTransferSubmit() {
  const valid = await transferFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
      '确定提交移交申请吗？移交后该学员将由目标教练负责。',
      '确认移交',
      { type: 'info' }
    )
    submitLoading.value = true
    await applyStudentTransfer(transferForm.studentId, transferForm.targetCoachId, transferForm.reason)
    ElMessage.success('移交申请已提交，等待管理员审核')
    transferDialogVisible.value = false
    fetchTransferRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  // 获取教练ID用于过滤目标教练列表（非必需，失败不影响主功能）
  try {
    const ratingRes = await getCoachRating()
    currentCoachId = ratingRes.coachId
  } catch (error) {
    console.warn('获取当前教练信息失败（仅影响过滤）:', error)
  }
  fetchMyStudents()
  fetchCoaches()
  fetchTransferRecords()
})
</script>

<style scoped lang="scss">
</style>
