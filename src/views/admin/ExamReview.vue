<template>
  <div class="exam-review">
    <el-card>
      <template #header>
        <span>考试审核</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="姓名模糊搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="未通过" :value="2" />
            <el-option label="已考试" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="regList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="100" />
        <el-table-column label="科目" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ getSubjectLabel(row.subject, row.licenseType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报名状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.statusDesc || getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="{ color: row.score >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ row.score }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="补考次数" width="90" align="center">
          <template #default="{ row }">
            {{ row.retakeCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 待审核状态：审核按钮 -->
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleAudit(row, true)">通过</el-button>
              <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <!-- 审核通过但未录入成绩：录入成绩按钮 -->
            <template v-else-if="row.status === 1 && row.score == null">
              <el-button link type="primary" size="small" @click="handleScore(row)">录入成绩</el-button>
            </template>
            <span v-else class="text-gray">-</span>
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

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核报名" width="400px" destroy-on-close>
      <div class="audit-info">
        <p><strong>学员：</strong>{{ currentRow?.studentName }}</p>
        <p><strong>科目：</strong>科目{{ currentRow?.subject }}</p>
        <p><strong>考试日期：</strong>{{ currentRow?.examDate || '-' }}</p>
        <p><strong>考试地点：</strong>{{ currentRow?.location || '-' }}</p>
      </div>
      <div class="audit-tip">
        <p v-if="auditForm.pass" style="color: #67c23a">
          <el-icon><Check /></el-icon> 审核通过后，将扣除考试名额并生成准考证
        </p>
        <p v-else style="color: #f56c6c">
          <el-icon><Close /></el-icon> 请确认拒绝该报名申请
        </p>
      </div>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">
          确认{{ auditForm.pass ? '通过' : '拒绝' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 录入成绩对话框 -->
    <el-dialog v-model="scoreDialogVisible" title="录入成绩" width="520px" destroy-on-close>
      <div class="audit-info">
        <p><strong>学员：</strong>{{ scoreForm.studentName }}</p>
        <p><strong>科目：</strong>科目{{ scoreForm.subject }}</p>
        <p><strong>考试日期：</strong>{{ scoreForm.examDate || '-' }}</p>
        <p><strong>考试地点：</strong>{{ scoreForm.location || '-' }}</p>
      </div>
      <el-form :model="scoreForm" label-width="100px" class="score-form">
        <el-form-item label="成绩截图" prop="fileId">
          <el-select v-model="scoreForm.fileId" placeholder="请选择学员上传的成绩截图" clearable style="width: 100%"
            :loading="fileListLoading">
            <el-option v-for="f in studentFileList" :key="f.id"
              :label="`${f.fileName} (${formatFileSize(f.fileSize)} · ${formatDateTime(f.uploadTime)})`"
              :value="f.id" />
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            仅显示该学员已上传的文件
          </div>
        </el-form-item>
        <el-form-item label="考试成绩" prop="score">
          <el-input-number v-model="scoreForm.score" :min="0" :max="100" :step="1" />
          <span style="margin-left: 12px; font-size: 13px; color: #909399">
            ≥90 分为合格
          </span>
        </el-form-item>
        <el-form-item label="合格判定">
          <el-tag :type="scoreForm.score >= 90 ? 'success' : 'danger'">
            {{ scoreForm.score >= 90 ? '合格' : '不合格' }}
          </el-tag>
          <span v-if="scoreForm.score < 90" style="margin-left: 10px; color: #909399; font-size: 12px">
            （补考次数 +1）
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleScoreSubmit" :loading="scoreLoading" :disabled="!scoreForm.fileId">确定录入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import { getExamRegistrationList, auditExamRegistration, scoreExamRegistration } from '@/api/exam'
import { getUserFiles } from '@/api/file'

const regList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

// 搜索
const searchForm = reactive({
  status: 0,  // 默认只展示待审核
  keyword: '',
})

// 审核
const auditDialogVisible = ref(false)
const currentRow = ref(null)
const auditForm = reactive({ pass: true })
const auditLoading = ref(false)

// 录入成绩
const scoreDialogVisible = ref(false)
const scoreForm = reactive({
  id: undefined,
  studentName: '',
  subject: '',
  examDate: '',
  location: '',
  fileId: null,
  score: 90,
})
const scoreLoading = ref(false)
const studentFileList = ref([])
const fileListLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.status !== undefined && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword
    const res = await getExamRegistrationList(params)
    regList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取考试报名列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.status = 0
  searchForm.keyword = ''
  pagination.page = 1
  fetchList()
}

function handleAudit(row, pass) {
  currentRow.value = row
  auditForm.pass = pass
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  auditLoading.value = true
  try {
    await auditExamRegistration(currentRow.value.id, auditForm.pass)
    ElMessage.success(auditForm.pass ? '审核通过' : '已拒绝')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function handleScore(row) {
  scoreForm.id = row.id
  scoreForm.studentName = row.studentName || ''
  scoreForm.subject = row.subject
  scoreForm.examDate = row.examDate
  scoreForm.location = row.location
  scoreForm.fileId = null
  scoreForm.score = 90
  studentFileList.value = []
  scoreDialogVisible.value = true
  // 加载该学员的文件列表
  fileListLoading.value = true
  getUserFiles(row.studentId).then(files => {
    studentFileList.value = Array.isArray(files) ? files : []
  }).catch(() => {
    studentFileList.value = []
  }).finally(() => {
    fileListLoading.value = false
  })
}

async function handleScoreSubmit() {
  if (!scoreForm.fileId) {
    ElMessage.warning('请选择成绩截图文件')
    return
  }
  scoreLoading.value = true
  try {
    await scoreExamRegistration(scoreForm.id, scoreForm.score, scoreForm.fileId)
    ElMessage.success('成绩录入成功')
    scoreDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('录入成绩失败:', error)
  } finally {
    scoreLoading.value = false
  }
}

const SPECIAL_TYPES = ['N1', 'N2', 'N3', 'M']
function getSubjectLabel(subject, licenseType) {
  if (SPECIAL_TYPES.includes(licenseType)) {
    return subject === 1 ? '理论' : '实操'
  }
  return '科目' + subject
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已考试' }
  return map[status] || '未知'
}

function formatFileSize(size) {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
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

.text-gray {
  color: #909399;
}

.audit-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;

  p {
    margin: 8px 0;
    font-size: 14px;
  }
}

.audit-tip {
  text-align: center;
  padding: 10px;

  p {
    margin: 0;
    font-size: 14px;
  }
}

.score-form {
  padding: 10px 0;
}
</style>
