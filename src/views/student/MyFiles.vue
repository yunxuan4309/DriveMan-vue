<template>
  <div class="my-files">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <el-button type="primary" @click="handleUpload">
            <el-icon><Plus /></el-icon>上传文件
          </el-button>
        </div>
      </template>

      <el-table :data="fileList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件类型" width="150" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getFileTypeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDownload(row)">
              下载
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
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
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="450px" destroy-on-close>
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文件类型" prop="fileType">
          <el-select v-model="uploadForm.fileType" placeholder="请选择文件类型" style="width: 100%">
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="体检表" value="physical_exam" />
            <el-option label="报名表" value="registration_pdf" />
            <el-option label="准考证" value="admission_ticket" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-change="onFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <p class="upload-tip">支持 PDF、JPG、PNG 格式，最大 5MB</p>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSubmit" :loading="uploadLoading">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUserFiles, uploadFile, downloadFile, deleteFile } from '@/api/file'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const fileList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

const uploadDialogVisible = ref(false)
const uploadForm = reactive({ fileType: '', file: null })
const uploadRef = ref(null)
const uploadLoading = ref(false)

function onFileChange(uploadFile) {
  uploadForm.file = uploadFile.raw
}

function getFileTypeLabel(type) {
  const map = {
    id_card_front: '身份证正面',
    id_card_back: '身份证反面',
    physical_exam: '体检表',
    registration_pdf: '报名表',
    admission_ticket: '准考证',
  }
  return map[type] || type
}

async function fetchFiles() {
  loading.value = true
  try {
    const res = await getUserFiles(userStore.userId)
    fileList.value = Array.isArray(res) ? res : []
    pagination.total = fileList.value.length
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleUpload() {
  uploadForm.fileType = ''
  uploadForm.file = null
  uploadDialogVisible.value = true
}

async function handleUploadSubmit() {
  if (!uploadForm.fileType) {
    ElMessage.warning('请选择文件类型')
    return
  }
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }
  uploadLoading.value = true
  try {
    await uploadFile(userStore.userId, uploadForm.file, uploadForm.fileType)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchFiles()
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    uploadLoading.value = false
  }
}

async function handleDownload(row) {
  try {
    const blob = await downloadFile(row.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除文件 "${row.fileName}" 吗？`, '提示', { type: 'warning' })
    await deleteFile(row.id)
    ElMessage.success('删除成功')
    fetchFiles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
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

onMounted(fetchFiles)
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
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
}
</style>
