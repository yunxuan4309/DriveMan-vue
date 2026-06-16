<template>
  <div class="notice-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>公告管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>发布公告
          </el-button>
        </div>
      </template>

      <el-table :data="noticeList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column label="发布时间" width="160" align="center">
          <template #default="{ row }">{{ formatTime(row.publishTime) }}</template>
        </el-table-column>
        <el-table-column label="过期时间" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.expireTime">{{ formatTime(row.expireTime) }}</span>
            <el-tag v-else size="small" type="info">永不过期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="isExpired(row)" size="small" type="info">已过期</el-tag>
            <el-tag v-else size="small" type="success">生效中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && noticeList.length === 0" description="暂无公告" style="margin-top: 40px" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="请输入公告内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="不设置则永不过期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAllNotices, createNotice, updateNotice, deleteNotice } from '@/api/notice'
import { formatDate } from '@/utils'

const noticeList = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

const form = reactive({
  id: null,
  title: '',
  content: '',
  expireTime: '',
})

const formRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { max: 100, message: '标题最多100个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { max: 500, message: '内容最多500个字符', trigger: 'blur' },
  ],
}

function formatTime(val) {
  return val ? formatDate(val, 'YYYY-MM-DD HH:mm:ss') : '-'
}

function isExpired(row) {
  if (!row.expireTime) return false
  return new Date(row.expireTime) < new Date()
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAllNotices()
    noticeList.value = res || []
  } catch {
    noticeList.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.title = ''
  form.content = ''
  form.expireTime = ''
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '发布公告'
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑公告'
  form.id = row.id
  form.title = row.title
  form.content = row.content
  form.expireTime = row.expireTime || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      expireTime: form.expireTime || null,
    }
    if (isEdit.value) {
      await updateNotice(form.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createNotice(payload)
      ElMessage.success('发布成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteNotice(row.id)
    ElMessage.success('删除成功')
    fetchList()
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.notice-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
