<template>
  <div class="file-manage">
    <el-card>
      <template #header>
        <span>文件管理</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="输入用户ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="searchForm.fileType" placeholder="全部" clearable style="width: 140px">
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="体检表" value="physical_exam" />
            <el-option label="报名表" value="registration_pdf" />
            <el-option label="准考证" value="admission_ticket" />
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
        <el-table-column prop="userId" label="用户ID" width="80" align="center" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getFileTypeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getUserFiles, downloadFile } from '@/api/file'

const searchForm = ref({ userId: '', fileType: '' })
const fileList = ref([])
const loading = ref(false)

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

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserFiles(searchForm.value.userId || undefined)
    let list = Array.isArray(res) ? res : []
    if (searchForm.value.fileType) {
      list = list.filter(f => f.fileType === searchForm.value.fileType)
    }
    fileList.value = list
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() { fetchList() }
function handleReset() {
  searchForm.value = { userId: '', fileType: '' }
  fetchList()
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
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
