<template>
  <div class="my-file-requests">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的文件请求</span>
          <el-badge :value="pendingCount" :hidden="pendingCount === 0">
            <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
          </el-badge>
        </div>
      </template>

      <el-table :data="requestList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="请求标题" min-width="160">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="danger" size="small" effect="dark" style="margin-right: 6px">待提交</el-tag>
            <el-tag v-else-if="row.status === 1" type="success" size="small" style="margin-right: 6px">已完成</el-tag>
            <el-tag v-else type="info" size="small" style="margin-right: 6px">已取消</el-tag>
            {{ row.title }}
          </template>
        </el-table-column>
        <el-table-column label="发起人" width="100" align="center">
          <template #default="{ row }">
            {{ row.requesterName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="截止日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.deadline || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="showUploadDialog(row)"
            >上传文件</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && requestList.length === 0" description="暂无文件请求" style="margin-top: 40px" />

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="total" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]"
          @size-change="fetchList" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 上传文件对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="420px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="请求标题">
          <span>{{ currentRequest?.title }}</span>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-change="handleFileChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button type="primary" plain>选择文件</el-button>
            <template #tip>
              <div style="color: #909399; font-size: 12px; margin-top: 4px">支持 JPG/PNG/PDF 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploadLoading" :disabled="!uploadFileRaw">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getMyFileRequests, getPendingFileRequestCount } from '@/api/fileRequest'
import { uploadFile } from '@/api/file'

const userStore = useUserStore()
const requestList = ref([])
const loading = ref(false)
const total = ref(0)
const pendingCount = ref(0)
const pagination = reactive({ page: 1, size: 10 })

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    const res = await getMyFileRequests(params)
    requestList.value = res.records || []
    total.value = res.total || 0
  } catch {
    requestList.value = []
  } finally {
    loading.value = false
  }
}

async function fetchPendingCount() {
  try {
    pendingCount.value = await getPendingFileRequestCount() || 0
  } catch {
    pendingCount.value = 0
  }
}

// 上传
const uploadDialogVisible = ref(false)
const currentRequest = ref(null)
const uploadFileRaw = ref(null)
const uploadLoading = ref(false)

function showUploadDialog(row) {
  currentRequest.value = row
  uploadFileRaw.value = null
  uploadDialogVisible.value = true
}

function handleFileChange(uploadFileObj) {
  uploadFileRaw.value = uploadFileObj.raw
}

async function handleUpload() {
  if (!uploadFileRaw.value) return
  uploadLoading.value = true
  try {
    const fileType = currentRequest.value.fileType || 'physical_exam'
    const bizType = currentRequest.value.bizType || fileType
    await uploadFile(userStore.userId, uploadFileRaw.value, fileType, bizType, currentRequest.value.id)
    ElMessage.success('文件上传成功，请求已完成')
    uploadDialogVisible.value = false
    fetchList()
    fetchPendingCount()
  } catch {
    // 错误已由拦截器处理
  } finally {
    uploadLoading.value = false
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  fetchList()
  fetchPendingCount()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.text-gray { color: #909399; }
</style>
