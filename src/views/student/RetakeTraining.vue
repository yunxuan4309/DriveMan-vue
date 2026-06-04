<template>
  <div class="retake-training">
    <!-- 可申请的挂科列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>可申请二次培训的科目</span>
          <el-button text type="primary" @click="fetchFailedExams" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="failedExamList" v-loading="failedLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科目" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="80" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c">{{ row.score ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleApply(row)"
            >申请二次培训</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!failedLoading && failedExamList.length === 0" description="暂无可以申请二次培训的科目" style="margin-top: 30px" />
    </el-card>

    <!-- 我的二次培训记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>我的二次培训记录</span>
          <el-button text type="primary" @click="fetchMyRecords" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="myRecords" v-loading="recordLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
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
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0 || row.status === 1"
              link
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >取消</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!recordLoading && myRecords.length === 0" description="暂无培训记录" style="margin-top: 30px" />
    </el-card>

    <!-- 申请二次培训对话框 -->
    <el-dialog v-model="applyDialogVisible" title="申请二次培训" width="500px" destroy-on-close>
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="科目">
          <el-tag type="primary">科目{{ applyForm.subject }}</el-tag>
        </el-form-item>
        <el-form-item label="考试日期">
          <span>{{ applyForm.examDate }}</span>
        </el-form-item>
        <el-form-item label="指定教练" v-if="coachList.length > 0">
          <el-select v-model="applyForm.coachId" placeholder="不指定由系统分配" clearable filterable style="width: 100%">
            <el-option
              v-for="c in coachList"
              :key="c.coachId || c.id"
              :label="c.realName"
              :value="c.coachId || c.id"
            />
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 4px">可选，不填则由系统分配教练</div>
        </el-form-item>
        <el-form-item label="申请说明">
          <el-input v-model="applyForm.reason" type="textarea" rows="3" placeholder="可选，填写申请说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApplySubmit" :loading="applyLoading">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getStudentExamRegistrations } from '@/api/exam'
import {
  applyRetakeTraining,
  getStudentRetakeTrainings,
  cancelRetakeTraining,
} from '@/api/retakeTraining'

const userStore = useUserStore()

// 可申请二次培训的挂科列表
const failedExamList = ref([])
const failedLoading = ref(false)

// 我的二次培训记录
const myRecords = ref([])
const recordLoading = ref(false)

// 教练列表（用于申请时指定）
const coachList = ref([])

// 申请对话框
const applyDialogVisible = ref(false)
const applyForm = ref({ examRegistrationId: null, subject: null, examDate: '', coachId: null, reason: '' })
const applyLoading = ref(false)

// 获取挂科的考试报名记录（passStatus=0 的）
async function fetchFailedExams() {
  failedLoading.value = true
  try {
    const res = await getStudentExamRegistrations(userStore.userId)
    // 筛选出已挂科（passStatus=0）且尚未申请二次培训的记录
    const failedRegs = Array.isArray(res) ? res : []
    // 过滤：已经申请过二次培训的 examRegistrationId 不再显示
    const appliedIds = new Set(myRecords.value.map(r => r.examRegistrationId))
    failedExamList.value = failedRegs.filter(r => r.passStatus === 0 && !appliedIds.has(r.id))
  } catch (error) {
    console.error('获取挂科列表失败:', error)
    failedExamList.value = []
  } finally {
    failedLoading.value = false
  }
}

// 获取我的二次培训记录
async function fetchMyRecords() {
  recordLoading.value = true
  try {
    const res = await getStudentRetakeTrainings(userStore.userId)
    myRecords.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取培训记录失败:', error)
    myRecords.value = []
  } finally {
    recordLoading.value = false
  }
}

// 打开申请对话框
function handleApply(row) {
  applyForm.value = {
    examRegistrationId: row.id,
    subject: row.subject,
    examDate: row.examDate,
    coachId: null,
    reason: '',
  }
  applyDialogVisible.value = true
}

// 提交申请
async function handleApplySubmit() {
  if (!applyForm.value.examRegistrationId) return
  applyLoading.value = true
  try {
    const data = {
      examRegistrationId: applyForm.value.examRegistrationId,
    }
    if (applyForm.value.coachId) {
      data.coachId = applyForm.value.coachId
    }
    if (applyForm.value.reason) {
      data.reason = applyForm.value.reason
    }
    await applyRetakeTraining(data)
    ElMessage.success('申请已提交')
    applyDialogVisible.value = false
    // 刷新列表
    await Promise.all([fetchFailedExams(), fetchMyRecords()])
  } catch (error) {
    console.error('申请失败:', error)
  } finally {
    applyLoading.value = false
  }
}

// 取消申请
async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定取消该二次培训申请？', '确认', { type: 'warning' })
    await cancelRetakeTraining(row.id)
    ElMessage.success('已取消')
    fetchMyRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消失败:', error)
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

onMounted(async () => {
  await fetchMyRecords()
  fetchFailedExams()
})
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
