<template>
  <div class="exam-sessions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考试场次管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>发布场次
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="searchForm.subject" placeholder="全部科目" clearable style="width: 120px">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option v-for="t in licenseTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="sessionList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="subject" label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="licenseType" label="适用车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examDate" label="考试日期" width="120" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="100" align="center" />
        <el-table-column prop="location" label="考试地点" min-width="160" show-overflow-tooltip />
        <el-table-column prop="totalQuota" label="总名额" width="80" align="center" />
        <el-table-column prop="remainingQuota" label="剩余名额" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.remainingQuota > 0 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
              {{ row.remainingQuota }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 发布/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑场次' : '发布场次'" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" placeholder="请选择" style="width: 100%">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用车型" prop="licenseType">
          <el-select v-model="form.licenseType" placeholder="请选择适用车型" style="width: 100%">
            <el-option v-for="t in licenseTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试日期" prop="examDate">
          <el-date-picker
            v-model="form.examDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="form.startTime"
            placeholder="选择时间"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="关联考场" prop="venueId">
          <el-select v-model="form.venueId" placeholder="选择考场（可选）" clearable style="width: 100%">
            <el-option
              v-for="venue in venueList"
              :key="venue.id"
              :label="venue.name"
              :value="venue.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="考试地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入考试地点" />
        </el-form-item>
        <el-form-item label="总名额" prop="totalQuota">
          <el-input-number v-model="form.totalQuota" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">{{ isEdit ? '保存' : '发布' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getExamSessionList, createExamSession, updateExamSession, deleteExamSession } from '@/api/exam'
import { getExamVenueList } from '@/api/examVenue'

const licenseTypes = ['C1', 'C2', 'C5', 'C6', 'B1', 'B2', 'A1', 'A2', 'A3', 'D', 'E', 'F', 'M', 'N', 'P']

const sessionList = ref([])
const loading = ref(false)
const venueList = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })

// 搜索表单
const searchForm = reactive({
  subject: undefined,
  licenseType: '',
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)
const form = reactive({
  id: undefined,
  subject: 1,
  licenseType: '',
  examDate: '',
  startTime: '',
  location: '',
  venueId: undefined,
  totalQuota: 100,
})

const formRules = {
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  licenseType: [{ required: true, message: '请选择适用车型', trigger: 'change' }],
  examDate: [{ required: true, message: '请选择考试日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  location: [{ required: true, message: '请输入考试地点', trigger: 'blur' }],
  totalQuota: [{ required: true, message: '请输入总名额', trigger: 'blur' }],
}

// 获取场次列表
async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
    }
    if (searchForm.subject) params.subject = searchForm.subject
    if (searchForm.licenseType) params.licenseType = searchForm.licenseType

    const res = await getExamSessionList(params)
    sessionList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取考试场次失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取考场列表
async function fetchVenueList() {
  try {
    const res = await getExamVenueList()
    venueList.value = res || []
  } catch (error) {
    console.error('获取考场列表失败:', error)
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchList()
}

// 重置
function handleReset() {
  searchForm.subject = undefined
  searchForm.licenseType = ''
  pagination.page = 1
  fetchList()
}

// 禁用过去日期
function disabledDate(date) {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

function resetForm() {
  form.id = undefined
  form.subject = 1
  form.licenseType = ''
  form.examDate = ''
  form.startTime = ''
  form.location = ''
  form.venueId = undefined
  form.totalQuota = 100
}

function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.subject = row.subject
  form.licenseType = row.licenseType || ''
  form.examDate = row.examDate
  form.startTime = row.startTime
  form.location = row.location
  form.venueId = row.venueId
  form.totalQuota = row.totalQuota
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = {
      subject: form.subject,
      licenseType: form.licenseType,
      examDate: form.examDate,
      startTime: form.startTime,
      location: form.location,
      venueId: form.venueId || null,
      totalQuota: form.totalQuota,
      remainingQuota: form.totalQuota,
      status: 1,
    }
    if (isEdit.value) {
      await updateExamSession(form.id, data)
      ElMessage.success('修改成功')
    } else {
      await createExamSession(data)
      ElMessage.success('发布成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该考试场次吗？`, '提示', { type: 'warning' })
    await deleteExamSession(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

function getStatusTagType(status) {
  const map = { 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 1: '报名中', 2: '已满', 3: '已结束' }
  return map[status] || '未知'
}

onMounted(() => {
  fetchList()
  fetchVenueList()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
