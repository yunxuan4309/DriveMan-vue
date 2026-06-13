<template>
  <div class="file-request-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件请求管理</span>
          <div>
            <el-button type="primary" @click="showCreateDialog" :icon="Plus">创建请求</el-button>
            <el-button text type="primary" @click="fetchList" :icon="Refresh" style="margin-left: 8px">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.targetName" placeholder="姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option label="待提交" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已取消" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="requestList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="请求标题" min-width="160">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            {{ row.title }}
          </template>
        </el-table-column>
        <el-table-column label="目标学员" width="100" align="center">
          <template #default="{ row }">
            {{ row.targetUserName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="发起人" width="100" align="center">
          <template #default="{ row }">
            {{ row.requesterName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="业务类型" width="100" align="center">
          <template #default="{ row }">
            {{ row.bizType || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="文件分类" width="110" align="center">
          <template #default="{ row }">
            {{ row.fileType || '-' }}
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
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleCancel(row)">取消</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && requestList.length === 0" description="暂无文件请求" style="margin-top: 40px" />

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="total" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]"
          @size-change="handleSearch" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 创建请求对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建文件提交请求" width="500px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="目标用户" prop="targetUserId">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-select
              v-model="userSearchRole"
              placeholder="角色"
              style="width: 120px; flex-shrink: 0"
              @change="onUserRoleChange"
            >
              <el-option label="全部" :value="null" />
              <el-option label="学员" :value="1" />
              <el-option label="教练" :value="2" />
            </el-select>
            <el-select
              v-model="createForm.targetUserId"
              placeholder="输入姓名搜索..."
              filterable
              remote
              :remote-method="searchTargetUsers"
              :loading="userSearchLoading"
              style="flex: 1"
            >
              <el-option
                v-for="u in userOptions"
                :key="u.userId"
                :label="u.realName + ' (' + u.username + ')'"
                :value="u.userId"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="请求标题" prop="title">
          <el-input v-model="createForm.title" placeholder="如：请上传体检结果报告" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="createForm.description" type="textarea" rows="2" placeholder="详细说明（可选）" />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="createForm.bizType" placeholder="选择业务类型" style="width: 100%">
            <el-option label="体检报告" value="physical_exam" />
            <el-option label="报名材料" value="enrollment" />
            <el-option label="成绩截图" value="exam_score" />
            <el-option label="用户资料" value="user_profile" />
            <el-option label="教练资质" value="coach_qualification" />
            <el-option label="增驾/准教车型变更" value="license_upgrade" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件分类">
          <el-select v-model="createForm.fileType" placeholder="选择文件分类" style="width: 100%">
            <el-option label="体检表" value="physical_exam" />
            <el-option label="成绩截图" value="exam_score" />
            <el-option label="身份证正面" value="id_card_front" />
            <el-option label="身份证反面" value="id_card_back" />
            <el-option label="资质证书" value="coach_qualification" />
            <el-option label="报名表 PDF" value="registration_pdf" />
            <el-option label="准考证 PDF" value="admission_ticket" />
            <el-option label="培训记录表 PDF" value="training_record" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="createForm.deadline" type="date" value-format="YYYY-MM-DD" placeholder="可选" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" rows="2" placeholder="内部备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="createLoading">创建请求</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { getAllFileRequests, createFileRequest, cancelFileRequest } from '@/api/fileRequest'
import { searchUsers } from '@/api/user'

const route = useRoute()
const router = useRouter()
const requestList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })
const searchForm = reactive({ targetName: '', status: undefined })

function handleSearch() { pagination.page = 1; fetchList() }
function handleReset() { searchForm.targetName = ''; searchForm.status = undefined; handleSearch() }

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.targetName) params.targetName = searchForm.targetName
    if (searchForm.status != null && searchForm.status !== '') params.status = searchForm.status
    const res = await getAllFileRequests(params)
    requestList.value = res.records || []
    total.value = res.total || 0
  } catch {
    requestList.value = []
  } finally {
    loading.value = false
  }
}

// 创建
const createDialogVisible = ref(false)
const createForm = reactive({ targetUserId: null, title: '', description: '', bizType: 'physical_exam', fileType: 'physical_exam', deadline: '', remark: '' })
const createLoading = ref(false)
const createFormRef = ref()
const createRules = {
  targetUserId: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
  title: [{ required: true, message: '请输入请求标题', trigger: 'blur' }],
}

// 远程搜索用户
const userSearchRole = ref(null)  // null=学员+教练, 1=学员, 2=教练
const userOptions = ref([])
const userSearchLoading = ref(false)

function showCreateDialog(prefill) {
  const defaults = { targetUserId: null, title: '', description: '', bizType: 'physical_exam', fileType: 'physical_exam', deadline: '', remark: '' }
  Object.assign(createForm, { ...defaults, ...prefill })
  userSearchRole.value = null
  userOptions.value = []
  if (prefill?.targetUserId && prefill?.targetUserName) {
    userOptions.value = [{ userId: prefill.targetUserId, realName: prefill.targetUserName, username: '' }]
  }
  createDialogVisible.value = true
}

async function searchTargetUsers(keyword) {
  if (!keyword || keyword.length < 1) {
    userOptions.value = []
    return
  }
  userSearchLoading.value = true
  try {
    const res = await searchUsers(keyword, userSearchRole.value)
    userOptions.value = Array.isArray(res) ? res : []
  } catch {
    userOptions.value = []
  } finally {
    userSearchLoading.value = false
  }
}

function onUserRoleChange() {
  userOptions.value = []
  createForm.targetUserId = null
}

async function handleCreate() {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return
  createLoading.value = true
  try {
    await createFileRequest(createForm)
    ElMessage.success('文件请求已创建')
    createDialogVisible.value = false
    fetchList()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createLoading.value = false
  }
}

// 取消
async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(`确定取消「${row.title}」？`, '确认取消', { type: 'warning' })
    await cancelFileRequest(row.id)
    ElMessage.success('已取消')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') console.error('取消失败:', e)
  }
}

function statusTag(s) { const m = { 0: 'danger', 1: 'success', 2: 'info' }; return m[s] || 'info' }
function statusText(s) { const m = { 0: '待提交', 1: '已完成', 2: '已取消' }; return m[s] || '未知' }

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  fetchList()
  // 如果路由带查询参数，自动打开创建对话框
  const q = route.query
  if (q.targetUserId) {
    showCreateDialog({
      targetUserId: Number(q.targetUserId),
      targetUserName: q.targetUserName || '',
      bizType: q.bizType || 'physical_exam',
      title: q.title || '',
    })
  }
})
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 20px; padding: 20px; background-color: #f5f7fa; border-radius: 4px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-gray { color: #909399; }
</style>
