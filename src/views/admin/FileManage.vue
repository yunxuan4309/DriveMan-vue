<template>
  <div class="file-manage">
    <el-card>
      <template #header>
        <span>文件管理</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="真实姓名">
          <el-input v-model="searchForm.realName" placeholder="输入姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable style="width: 120px">
            <el-option label="学员" :value="1" />
            <el-option label="教练" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.bizType" placeholder="全部" clearable style="width: 160px">
            <el-option label="用户资料" value="user_profile" />
            <el-option label="报名材料" value="enrollment" />
            <el-option label="准考证" value="exam_ticket" />
            <el-option label="报名表" value="registration_form" />
            <el-option label="培训记录表" value="training_record" />
            <el-option label="体检报告" value="physical_exam" />
            <el-option label="教练资质" value="coach_qualification" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件分类">
          <el-select v-model="searchForm.fileType" placeholder="全部" clearable style="width: 140px">
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="体检表" value="physical_exam" />
            <el-option label="报名表" value="registration_pdf" />
            <el-option label="准考证" value="admission_ticket" />
            <el-option label="培训记录表" value="training_record" />
            <el-option label="教练资质" value="coach_qualification" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="fileList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="用户姓名" width="100" align="center" />
        <el-table-column prop="userId" label="用户ID" width="80" align="center" />
        <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getFileTypeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bizType" label="业务类型" width="130" align="center">
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
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handlePreview(row)">
              预览
            </el-button>
            <el-button link type="success" size="small" @click="handleDownload(row)">
              下载
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="文件预览" width="800px" destroy-on-close>
      <div class="preview-container">
        <iframe v-if="previewUrl" :src="previewUrl" class="preview-iframe" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { queryFiles } from '@/api/admin'
import { downloadFile, deleteFile } from '@/api/file'

const searchForm = reactive({
  realName: '',
  role: undefined,
  bizType: '',
  fileType: '',
})

const fileList = ref([])
const loading = ref(false)

const previewDialogVisible = ref(false)
const previewUrl = ref('')

const fileTypeMap = {
  id_card_front: '身份证正面',
  id_card_back: '身份证反面',
  physical_exam: '体检表',
  registration_pdf: '报名表',
  admission_ticket: '准考证',
  training_record: '培训记录表',
  coach_qualification: '教练资质',
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

async function fetchList() {
  // 至少需要一个查询条件
  if (!searchForm.realName && !searchForm.role) {
    ElMessage.warning('请输入真实姓名或选择用户角色')
    return
  }

  loading.value = true
  try {
    const params = {}
    if (searchForm.realName) params.realName = searchForm.realName
    if (searchForm.role) params.role = searchForm.role

    const res = await queryFiles(params)
    let list = Array.isArray(res) ? res : []

    // 前端过滤
    if (searchForm.bizType) {
      list = list.filter(f => f.bizType === searchForm.bizType)
    }
    if (searchForm.fileType) {
      list = list.filter(f => f.fileType === searchForm.fileType)
    }

    fileList.value = list
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchList()
}

function handleReset() {
  searchForm.realName = ''
  searchForm.role = undefined
  searchForm.bizType = ''
  searchForm.fileType = ''
  fileList.value = []
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

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除文件 "${row.fileName}" 吗？此操作不会删除磁盘文件。`, '提示', { type: 'warning' })
    await deleteFile(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  // 初始加载时不自动查询，需要用户输入条件
})
</script>

<style scoped lang="scss">
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
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
</style>
