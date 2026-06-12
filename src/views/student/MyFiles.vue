<template>
  <div class="my-files">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <div class="header-actions">
            <el-button type="success" @click="handleGenerateRecord" :loading="generating">
              <el-icon><Document /></el-icon>生成培训记录表
            </el-button>
            <el-button type="primary" @click="handleUpload">
              <el-icon><Plus /></el-icon>上传文件
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.bizType" placeholder="全部" clearable style="width: 160px" @change="handleSearch">
            <el-option label="用户资料" value="user_profile" />
            <el-option label="报名材料" value="enrollment" />
            <el-option label="准考证" value="exam_ticket" />
            <el-option label="报名表" value="registration_form" />
            <el-option label="培训记录表" value="training_record" />
            <el-option label="体检报告" value="physical_exam" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件分类">
          <el-select v-model="searchForm.fileType" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="体检表" value="physical_exam" />
            <el-option label="报名表" value="registration_pdf" />
            <el-option label="准考证" value="admission_ticket" />
            <el-option label="培训记录表" value="training_record" />
            <el-option label="教练资质" value="coach_qualification" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索文件名" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="fileList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getFileTypeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bizType" label="业务类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getBizTypeLabel(row.bizType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="90" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handlePreview(row)">
              预览
            </el-button>
            <el-button link type="success" size="small" @click="handleDownload(row)">
              下载
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
          :page-sizes="[5, 10, 20]"
          @size-change="fetchFiles"
          @current-change="fetchFiles"
        />
      </div>
    </el-card>

    <!-- 上传文件对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="500px" destroy-on-close>
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
        <!-- 关联文件请求 -->
        <el-form-item v-if="pendingRequests.length > 0" label="关联请求">
          <el-select v-model="selectedFileRequestId" placeholder="选择一个待完成的文件请求（可选）" clearable style="width: 100%"
            @change="onFileRequestSelect">
            <el-option v-for="fr in pendingRequests" :key="fr.id" :label="fr.title" :value="fr.id" />
          </el-select>
          <div v-if="selectedFileRequestId" style="color: #67c23a; font-size: 12px; margin-top: 4px">
            已关联请求，业务类型和文件分类已自动填充
          </div>
        </el-form-item>
        <el-form-item label="业务类型" prop="bizType">
          <el-select v-model="uploadForm.bizType" placeholder="请选择业务类型" style="width: 100%">
            <el-option label="用户资料" value="user_profile" />
            <el-option label="报名材料" value="enrollment" />
            <el-option label="体检报告" value="physical_exam" />
            <el-option label="增驾/准教车型变更材料" value="license_upgrade" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件分类" prop="fileType">
          <el-select v-model="uploadForm.fileType" placeholder="请选择文件分类" style="width: 100%">
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="体检表" value="physical_exam" />
            <el-option label="报名表 PDF" value="registration_pdf" />
            <el-option label="准考证 PDF" value="admission_ticket" />
            <el-option label="培训记录表 PDF" value="training_record" />
            <el-option label="教练资质材料" value="coach_qualification" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :accept="acceptTypes"
            :on-change="onFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <p class="upload-tip">支持 PDF、JPG、PNG、BMP、WEBP 格式，最大 5MB</p>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSubmit" :loading="uploadLoading">上传</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="文件预览" width="800px" destroy-on-close>
      <div class="preview-container">
        <iframe v-if="previewUrl && isPdfOrImage" :src="previewUrl" class="preview-iframe" />
        <img v-else-if="previewUrl && isImage" :src="previewUrl" class="preview-image" alt="预览" />
        <div v-else class="preview-unsupported">
          <el-icon :size="48"><Document /></el-icon>
          <p>此文件类型暂不支持预览，请下载后查看</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document } from '@element-plus/icons-vue'
import { getMyFiles, uploadFile, downloadFile, generateTrainingRecord } from '@/api/file'
import { getMyFileRequests } from '@/api/fileRequest'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const fileList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

const searchForm = reactive({
  bizType: '',
  fileType: '',
  keyword: '',
})

const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({ bizType: '', fileType: '', file: null })
const uploadRef = ref(null)
const uploadLoading = ref(false)
const pendingRequests = ref([])
const selectedFileRequestId = ref(null)
const selectedFileRequest = ref(null)
const generating = ref(false)

const previewDialogVisible = ref(false)
const previewUrl = ref('')

const uploadRules = {
  bizType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  fileType: [{ required: true, message: '请选择文件分类', trigger: 'change' }],
}

const acceptTypes = '.jpg,.jpeg,.png,.bmp,.webp,.pdf'

const isPdfOrImage = computed(() => {
  return previewUrl.value && (previewUrl.value.includes('.pdf') || isImage.value)
})

const isImage = computed(() => {
  return previewUrl.value && /\.(jpg|jpeg|png|bmp|webp)/i.test(previewUrl.value)
})

const fileTypeMap = {
  id_card_front: '身份证正面',
  id_card_back: '身份证反面',
  physical_exam: '体检表',
  registration_pdf: '报名表 PDF',
  admission_ticket: '准考证 PDF',
  training_record: '培训记录表 PDF',
  coach_qualification: '教练资质材料',
}

const bizTypeMap = {
  user_profile: '用户资料',
  enrollment: '报名材料',
  exam_ticket: '准考证',
  registration_form: '报名表',
  training_record: '培训记录表',
  physical_exam: '体检报告',
  license_upgrade: '增驾/准教车型变更',
  coach_qualification: '教练资质',
}

function getFileTypeLabel(type) {
  return fileTypeMap[type] || type || '-'
}

function getBizTypeLabel(type) {
  return bizTypeMap[type] || type || '-'
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
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

async function fetchFiles() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
    }
    if (searchForm.bizType) params.bizType = searchForm.bizType
    if (searchForm.fileType) params.fileType = searchForm.fileType
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const res = await getMyFiles(params)
    fileList.value = Array.isArray(res) ? res : res.records || []
    pagination.total = res.total || fileList.value.length
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchFiles()
}

function handleReset() {
  searchForm.bizType = ''
  searchForm.fileType = ''
  searchForm.keyword = ''
  handleSearch()
}

function onFileChange(uploadFile) {
  uploadForm.file = uploadFile.raw
}

async function fetchPendingRequests() {
  try {
    const res = await getMyFileRequests({ page: 1, size: 50 })
    pendingRequests.value = (res.records || []).filter(r => r.status === 0)
  } catch {
    pendingRequests.value = []
  }
}

function onFileRequestSelect(requestId) {
  selectedFileRequest.value = pendingRequests.value.find(r => r.id === requestId) || null
  if (selectedFileRequest.value) {
    uploadForm.bizType = selectedFileRequest.value.bizType || 'physical_exam'
    uploadForm.fileType = selectedFileRequest.value.fileType || 'physical_exam'
  } else {
    uploadForm.bizType = ''
    uploadForm.fileType = ''
  }
}

function handleUpload() {
  uploadForm.bizType = ''
  uploadForm.fileType = ''
  uploadForm.file = null
  selectedFileRequestId.value = null
  selectedFileRequest.value = null
  uploadDialogVisible.value = true
  fetchPendingRequests()
}

async function handleUploadSubmit() {
  const valid = await uploadFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }

  // 校验文件大小（5MB）
  if (uploadForm.file.size > 5 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 5MB')
    return
  }

  uploadLoading.value = true
  try {
    const bizId = selectedFileRequest.value ? selectedFileRequest.value.id : null
    await uploadFile(userStore.userId, uploadForm.file, uploadForm.fileType, uploadForm.bizType, bizId)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchFiles()
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    uploadLoading.value = false
  }
}

async function handlePreview(row) {
  try {
    const blob = await downloadFile(row.id, true)
    previewUrl.value = window.URL.createObjectURL(blob)
    previewDialogVisible.value = true
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败')
  }
}

async function handleDownload(row) {
  try {
    const blob = await downloadFile(row.id, false)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

async function handleGenerateRecord() {
  try {
    await ElMessageBox.confirm(
      '确定要生成培训记录表吗？\n请确保学时已达标。',
      '生成培训记录表',
      { type: 'info' }
    )
    generating.value = true
    const res = await generateTrainingRecord(userStore.userId)
    ElMessage.success('培训记录表已生成')
    fetchFiles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('生成失败:', error)
    }
  } finally {
    generating.value = false
  }
}

onMounted(fetchFiles)
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
}

.preview-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  width: 100%;
  height: 600px;
  border: none;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
}

.preview-unsupported {
  text-align: center;
  color: #909399;

  p {
    margin-top: 16px;
  }
}
</style>
