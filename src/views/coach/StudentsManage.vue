<template>
  <div class="students-manage">
    <!-- 我的学员列表 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>我的学员（共 {{ studentList.length }} 人）</span>
          <div>
            <el-button
              type="warning"
              :disabled="selectedStudents.length === 0"
              @click="handleBatchTransfer"
            >
              批量移交（{{ selectedStudents.length }}）
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        ref="studentTableRef"
        :data="studentList"
        v-loading="studentLoading"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="110" align="center">
          <template #default="{ row }">
            {{ row.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="130" align="center">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报考车型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="身份证号" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.idCard || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="handleSingleTransfer(row)">
              移交
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!studentLoading && studentList.length === 0" description="暂无学员" style="margin-top: 40px" />
    </el-card>

    <!-- 移交申请记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>移交申请记录</span>
          <el-button text type="primary" @click="fetchTransferRecords" :icon="Refresh">刷新</el-button>
        </div>
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
        <el-table-column label="移交原因" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.transferReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">
              {{ statusText(row.status) }}
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
    <el-dialog v-model="dialogVisible" title="学员移交" width="520px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="移交学员">
          <div class="transfer-students">
            <el-tag
              v-for="s in form.students"
              :key="s.studentId"
              closable
              :disable-transitions="false"
              style="margin: 2px 4px 2px 0"
              @close="removeStudent(s.studentId)"
            >
              {{ s.realName }}
            </el-tag>
            <span v-if="form.students.length === 0" style="color: #909399">请从列表中选择学员</span>
          </div>
        </el-form-item>
        <el-form-item label="目标教练" prop="targetCoachId">
          <el-select
            v-model="form.targetCoachId"
            placeholder="请选择接收教练"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="c in coachList"
              :key="c.coachId"
              :label="(c.realName || '教练') + ' · ' + c.vehicleType"
              :value="c.coachId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="移交原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入移交原因（如：因故无法继续带教）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMyStudents, getCoachList, applyStudentTransfer, getCoachTransferRecords, getCoachRating } from '@/api/coach'

const studentTableRef = ref(null)
const studentList = ref([])
const studentLoading = ref(false)
const selectedStudents = ref([])

const coachList = ref([])
const transferList = ref([])
const transferLoading = ref(false)
const submitLoading = ref(false)

const dialogVisible = ref(false)
const formRef = ref(null)
const form = reactive({
  students: [],
  targetCoachId: null,
  reason: '',
})
const rules = {
  targetCoachId: [{ required: true, message: '请选择接收教练', trigger: 'change' }],
  reason: [{ required: true, message: '请输入移交原因', trigger: 'blur' }],
}

let currentCoachId = null

function statusTag(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[status] || 'info'
}
function statusText(status) {
  return { 0: '待审核', 1: '已通过', 2: '已拒绝' }[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function handleSelectionChange(val) {
  selectedStudents.value = val
}

function removeStudent(studentId) {
  // 从 form.students 中移除
  form.students = form.students.filter(s => s.studentId !== studentId)
  // 同步取消表格勾选
  if (studentTableRef.value) {
    studentTableRef.value.toggleRowSelection(
      studentList.value.find(s => s.studentId === studentId),
      false
    )
  }
}

function openTransferDialog(students) {
  form.students = [...students]
  form.targetCoachId = null
  form.reason = ''
  dialogVisible.value = true
}

function handleSingleTransfer(row) {
  openTransferDialog([{ studentId: row.studentId, realName: row.realName }])
}

function handleBatchTransfer() {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学员')
    return
  }
  const students = selectedStudents.value.map(s => ({
    studentId: s.studentId,
    realName: s.realName,
  }))
  openTransferDialog(students)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
      `确定将 ${form.students.length} 名学员移交给目标教练吗？`,
      '确认移交',
      { type: 'info' }
    )
    submitLoading.value = true
    const studentIds = form.students.map(s => s.studentId).join(',')
    await applyStudentTransfer(studentIds, form.targetCoachId, form.reason)
    ElMessage.success('移交申请已提交，等待管理员审核')
    dialogVisible.value = false
    fetchTransferRecords()
    // 清空勾选
    if (studentTableRef.value) studentTableRef.value.clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  } finally {
    submitLoading.value = false
  }
}

async function fetchStudents() {
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

onMounted(async () => {
  try {
    const ratingRes = await getCoachRating()
    currentCoachId = ratingRes.coachId
  } catch (error) {
    console.warn('获取当前教练信息失败:', error)
  }
  await Promise.all([fetchStudents(), fetchCoaches(), fetchTransferRecords()])
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.transfer-students {
  min-height: 28px;
  line-height: 28px;
}
</style>
