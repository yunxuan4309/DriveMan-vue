<template>
  <div class="coach-assignment">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教练分配</span>
          <el-button type="primary" @click="handleAssign">
            <el-icon><Plus /></el-icon>手动分配
          </el-button>
        </div>
      </template>

      <el-table :data="assignmentList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="120" />
        <el-table-column prop="coachName" label="教练姓名" width="120" />
        <el-table-column label="绑定时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status !== 0 ? 'success' : 'info'">
              {{ row.status !== 0 ? '已绑定' : '已解绑' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 0"
              link type="danger" size="small"
              @click="handleUnbind(row)"
            >
              解绑
            </el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分配对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配教练" width="450px" destroy-on-close>
      <el-form :model="assignForm" ref="assignFormRef" :rules="assignRules" label-width="80px">
        <el-form-item label="学员" prop="studentId">
          <el-select v-model="assignForm.studentId" placeholder="请选择学员" filterable style="width: 100%">
            <el-option
              v-for="s in studentList"
              :key="s.studentId || s.userId"
              :label="(s.realName || s.username) + ' (ID:' + (s.studentId || s.userId) + ')'"
              :value="s.studentId || s.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教练" prop="coachId">
          <el-select v-model="assignForm.coachId" placeholder="请选择教练" filterable style="width: 100%">
            <el-option
              v-for="c in coachList"
              :key="c.coachId"
              :label="(c.realName || '教练') + ' (' + c.vehicleType + ')'"
              :value="c.coachId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit" :loading="assignLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCoachAssignments, assignCoach, unbindCoach, getCoachList } from '@/api/coach'
import { getStudentList } from '@/api/student'

const assignmentList = ref([])
const loading = ref(false)

const assignDialogVisible = ref(false)
const assignFormRef = ref(null)
const assignLoading = ref(false)
const assignForm = ref({ studentId: undefined, coachId: undefined })
const assignRules = {
  studentId: [{ required: true, message: '请选择学员', trigger: 'change' }],
  coachId: [{ required: true, message: '请选择教练', trigger: 'change' }],
}

const studentList = ref([])
const coachList = ref([])

async function fetchAssignments() {
  loading.value = true
  try {
    const res = await getCoachAssignments()
    assignmentList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取绑定关系失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchStudents() {
  try {
    const res = await getStudentList()
    studentList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取学员列表失败:', error)
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

function handleAssign() {
  assignForm.value = { studentId: undefined, coachId: undefined }
  fetchStudents()
  fetchCoaches()
  assignDialogVisible.value = true
}

async function handleAssignSubmit() {
  const valid = await assignFormRef.value?.validate().catch(() => false)
  if (!valid) return
  assignLoading.value = true
  try {
    await assignCoach(assignForm.value.studentId, assignForm.value.coachId)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchAssignments()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    assignLoading.value = false
  }
}

async function handleUnbind(row) {
  try {
    await ElMessageBox.confirm(`确定要解绑 "${row.studentName}" 与 "${row.coachName}" 的绑定关系吗？`, '提示', { type: 'warning' })
    await unbindCoach(row.id)
    ElMessage.success('解绑成功')
    fetchAssignments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑失败:', error)
    }
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchAssignments)
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.text-gray { color: #909399; }
</style>
