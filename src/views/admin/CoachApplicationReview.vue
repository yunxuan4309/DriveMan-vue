<template>
  <div class="coach-application-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教练申请审核</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="appList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="申请类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.applyType === '教练移交' ? 'warning' : 'primary'" size="small">
              {{ row.applyType || '学员申请' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="信息" min-width="200">
          <template #default="{ row }">
            <template v-if="!row.applyType || row.applyType === '学员申请'">
              <span>学员 {{ row.studentName }} 申请 {{ row.coachName }}</span>
            </template>
            <template v-else-if="row.applyType === '教练移交'">
              <div>
                <span>教练 {{ row.sourceCoachName }} 申请将学员 {{ row.studentName }}</span>
              </div>
              <div style="color: #909399; font-size: 12px">
                移交给 {{ row.coachName }}
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="移交原因" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.transferReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleAudit(row, true)">通过</el-button>
              <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="total" layout="total, prev, pager, next" @current-change="fetchList" />
      </div>

      <el-empty v-if="!loading && appList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核申请" width="450px" destroy-on-close>
      <p style="margin-bottom: 16px">
        <strong>申请类型：</strong>
        <el-tag :type="currentRow?.applyType === '教练移交' ? 'warning' : 'primary'" size="small">
          {{ currentRow?.applyType || '学员申请' }}
        </el-tag>
      </p>
      <template v-if="currentRow?.applyType === '教练移交'">
        <p>
          <strong>移交说明：</strong>{{ currentRow?.sourceCoachName }} → {{ currentRow?.studentName }} → {{ currentRow?.coachName }}
        </p>
        <p style="color: #909399; font-size: 12px">
          <strong>原因：</strong>{{ currentRow?.transferReason }}
        </p>
      </template>
      <el-form :model="auditForm" label-width="80px" style="margin-top: 16px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拒绝原因" v-if="!auditForm.pass">
          <el-input v-model="auditForm.reason" type="textarea" rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getCoachApplications, auditApplication } from '@/api/coach'

const appList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })

const searchForm = reactive({
  status: undefined,
  keyword: '',
})

const currentRow = ref(null)
const auditDialogVisible = ref(false)
const auditForm = reactive({ id: undefined, pass: true, reason: '' })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.status !== undefined && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword
    const res = await getCoachApplications(params)
    appList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取申请列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.status = undefined
  searchForm.keyword = ''
  pagination.page = 1
  fetchList()
}

function handleAudit(row, pass) {
  currentRow.value = row
  auditForm.id = row.id
  auditForm.pass = pass
  auditForm.reason = ''
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (!auditForm.pass && !auditForm.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  auditLoading.value = true
  try {
    await auditApplication(auditForm.id, auditForm.pass, auditForm.reason)
    ElMessage.success(auditForm.pass ? '已通过' : '已拒绝')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
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
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 20px; padding: 20px; background-color: #f5f7fa; border-radius: 4px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-gray { color: #909399; }
</style>
