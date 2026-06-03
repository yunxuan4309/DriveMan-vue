<template>
  <div class="special-exam-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>特种车辆考试管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>录入成绩
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员ID">
          <el-input-number v-model="searchForm.studentId" placeholder="请输入学员ID" :min="1" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option label="N1" value="N1" />
            <el-option label="N2" value="N2" />
            <el-option label="N3" value="N3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="examList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学员ID" width="80" />
        <el-table-column prop="licenseType" label="车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.licenseType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="80" align="center">
          <template #default="{ row }">
            {{ row.subject === 1 ? '理论' : '实操' }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.passStatus === 1 ? 'text-success' : 'text-danger'">
              {{ row.score }}分
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="passStatus" label="是否合格" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.passStatus === 1 ? 'success' : 'danger'">
              {{ row.passStatus === 1 ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="retakeCount" label="补考次数" width="100" align="center" />
        <el-table-column prop="examDate" label="考试时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.examDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="certNo" label="证书编号" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.certNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>修改
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 录入/修改成绩对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="学员ID" prop="studentId">
          <el-input-number v-model="form.studentId" :min="1" style="width: 100%" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="车型" prop="licenseType">
          <el-select v-model="form.licenseType" placeholder="请选择车型" style="width: 100%" :disabled="isEdit">
            <el-option label="N1" value="N1" />
            <el-option label="N2" value="N2" />
            <el-option label="N3" value="N3" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-radio-group v-model="form.subject" :disabled="isEdit">
            <el-radio :label="1">理论</el-radio>
            <el-radio :label="2">实操</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="成绩" prop="score">
          <el-input-number v-model="form.score" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否合格" prop="passStatus">
          <el-radio-group v-model="form.passStatus">
            <el-radio :label="1">合格</el-radio>
            <el-radio :label="0">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="考试时间" prop="examDate">
          <el-date-picker v-model="form.examDate" type="datetime" placeholder="选择考试时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Edit } from '@element-plus/icons-vue'
import { getSpecialExamList, createSpecialExam, updateSpecialExam } from '@/api/specialExam'

// 搜索表单
const searchForm = reactive({
  studentId: undefined,
  licenseType: '',
})

// 数据列表
const examList = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

// 表单
const form = reactive({
  id: undefined,
  studentId: undefined,
  licenseType: '',
  subject: 1,
  score: 80,
  passStatus: 1,
  examDate: '',
})

// 表单校验规则
const formRules = {
  studentId: [{ required: true, message: '请输入学员ID', trigger: 'blur' }],
  licenseType: [{ required: true, message: '请选择车型', trigger: 'change' }],
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  score: [{ required: true, message: '请输入成绩', trigger: 'blur' }],
  passStatus: [{ required: true, message: '请选择是否合格', trigger: 'change' }],
  examDate: [{ required: true, message: '请选择考试时间', trigger: 'change' }],
}

// 获取考试记录列表
async function fetchExamList() {
  loading.value = true
  try {
    const params = {}
    if (searchForm.licenseType) {
      params.licenseType = searchForm.licenseType
    }
    const res = await getSpecialExamList(params)
    examList.value = res || []
  } catch (error) {
    console.error('获取考试记录列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  fetchExamList()
}

// 重置
function handleReset() {
  searchForm.studentId = undefined
  searchForm.licenseType = ''
  fetchExamList()
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '录入考试成绩'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '修改考试成绩'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const submitData = {
      ...form,
      examDate: form.examDate ? new Date(form.examDate).toISOString() : '',
    }

    if (isEdit.value) {
      const { id, studentId, licenseType, subject, ...updateData } = submitData
      await updateSpecialExam(form.id, updateData)
      ElMessage.success('修改成功')
    } else {
      await createSpecialExam(submitData)
      ElMessage.success('录入成功')
    }
    dialogVisible.value = false
    fetchExamList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  form.id = undefined
  form.studentId = undefined
  form.licenseType = ''
  form.subject = 1
  form.score = 80
  form.passStatus = 1
  form.examDate = ''
}

// 工具函数
function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchExamList()
})
</script>

<style scoped lang="scss">
.special-exam-manage {
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

  .text-success {
    color: #67c23a;
    font-weight: bold;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
