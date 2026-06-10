<template>
  <div class="admin-physical-exam">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>体检申请管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.studentName" placeholder="姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核不通过" :value="2" />
            <el-option label="已完成" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.studentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="体检地点" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预约日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="体检结果" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 3">
              <el-tag v-if="row.result === 1" type="success" size="small">合格</el-tag>
              <el-tag v-else type="danger" size="small">不合格</el-tag>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="handleAudit(row)"
            >审核</el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="handleRecordResult(row)"
            >录入结果</el-button>
            <span v-else-if="row.status !== 0 && row.status !== 1" class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="total" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" @size-change="handleSearch" @current-change="fetchList" />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无体检申请" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核体检申请" width="450px" destroy-on-close>
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="体检地点">
          <span>{{ currentRow?.location }}</span>
        </el-form-item>
        <el-form-item label="预约日期">
          <span>{{ currentRow?.examDate }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" :placeholder="auditForm.status === 2 ? '请填写不通过原因' : '可选备注'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 录入体检结果对话框 -->
    <el-dialog v-model="resultDialogVisible" title="录入体检结果" width="480px" destroy-on-close>
      <el-form :model="resultForm" label-width="100px">
        <el-form-item label="体检地点">
          <span>{{ currentRow?.location }}</span>
        </el-form-item>
        <el-form-item label="体检报告" prop="fileId">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleResultFileChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button type="primary" plain>
              {{ resultFileName || '选择体检报告文件' }}
            </el-button>
            <template #tip>
              <div style="color: #909399; font-size: 12px; margin-top: 4px">支持 JPG/PNG/PDF 格式</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="体检结果">
          <el-radio-group v-model="resultForm.result">
            <el-radio :label="1">合格</el-radio>
            <el-radio :label="0">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resultDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResultSubmit" :loading="resultLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { uploadFile } from '@/api/file'
import {
  getAllPhysicalExams,
  auditPhysicalExam,
  setPhysicalExamResult,
} from '@/api/physicalExam'

const userStore = useUserStore()

const recordList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })
const currentRow = ref(null)

const searchForm = reactive({
  studentName: '',
  status: undefined,
})

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({ status: 1, remark: '' })
const auditLoading = ref(false)

// 录入结果
const resultDialogVisible = ref(false)
const resultForm = reactive({ fileId: null, result: 1 })
const resultLoading = ref(false)
const resultFileName = ref('')

function handleSearch() {
  pagination.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.studentName) params.studentName = searchForm.studentName
    if (searchForm.status !== undefined && searchForm.status !== null && searchForm.status !== '') {
      params.status = searchForm.status
    }
    const res = await getAllPhysicalExams(params)
    recordList.value = Array.isArray(res) ? res : res.records || []
    total.value = res.total || recordList.value.length
  } catch (error) {
    console.error('获取体检记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.studentName = ''
  searchForm.status = undefined
  handleSearch()
}

function handleAudit(row) {
  currentRow.value = row
  auditForm.status = 1
  auditForm.remark = ''
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('审核不通过时请填写备注原因')
    return
  }
  auditLoading.value = true
  try {
    const data = { status: auditForm.status }
    if (auditForm.remark) data.remark = auditForm.remark
    await auditPhysicalExam(currentRow.value.id, data)
    ElMessage.success(auditForm.status === 1 ? '审核已通过' : '已拒绝申请')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function handleRecordResult(row) {
  currentRow.value = row
  resultForm.fileId = null
  resultForm.result = 1
  resultFileName.value = ''
  resultForm._file = null
  resultDialogVisible.value = true
}

function handleResultFileChange(uploadFile) {
  resultFileName.value = uploadFile.name
  resultForm._file = uploadFile.raw
}

async function handleResultSubmit() {
  let fileId = null
  if (resultForm._file) {
    resultLoading.value = true
    try {
      const uploadRes = await uploadFile(userStore.userId, resultForm._file, 'image', 'physical_exam')
      fileId = uploadRes?.fileId || uploadRes?.id || uploadRes
    } catch (error) {
      console.error('上传体检报告失败:', error)
      ElMessage.error('体检报告上传失败')
      resultLoading.value = false
      return
    }
  }
  if (!fileId) {
    ElMessage.warning('请上传体检报告文件')
    resultLoading.value = false
    return
  }

  resultLoading.value = true
  try {
    await setPhysicalExamResult(currentRow.value.id, {
      fileId,
      result: resultForm.result,
    })
    ElMessage.success('体检结果已录入')
    resultDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('录入失败:', error)
  } finally {
    resultLoading.value = false
  }
}

function getStatusTag(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'success' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已完成' }
  return map[status] || '未知'
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

.text-gray {
  color: #909399;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
