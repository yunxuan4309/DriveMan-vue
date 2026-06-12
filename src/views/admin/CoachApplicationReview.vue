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
        <el-form-item label="申请类型">
          <el-select v-model="searchForm.applyType" placeholder="全部类型" clearable style="width: 130px" @change="handleSearch">
            <el-option label="学员申请" value="student" />
            <el-option label="教练移交" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="输入姓名搜索" clearable style="width: 160px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="appList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="申请类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.applyType === '教练移交' ? 'warning' : 'primary'" size="small" effect="plain">
              {{ row.applyType || '学员申请' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.studentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="教练信息" min-width="180">
          <template #default="{ row }">
            <template v-if="!row.applyType || row.applyType === '学员申请'">
              <span style="color: #409eff">目标教练：{{ row.coachName || '-' }}</span>
            </template>
            <template v-else>
              <div>
                <span style="color: #909399">源教练：{{ row.sourceCoachName || '-' }}</span>
                <el-icon style="margin: 0 4px"><ArrowRight /></el-icon>
                <span style="color: #409eff">目标教练：{{ row.coachName || '-' }}</span>
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="移交原因" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.transferReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 2 && row.auditReason" style="color: #f56c6c">{{ row.auditReason }}</span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.auditTime ? formatDateTime(row.auditTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleAudit(row, true)">通过</el-button>
              <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
      <el-empty v-if="!loading && appList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" :title="auditForm.pass ? '确认通过' : '确认拒绝'" width="450px" destroy-on-close>
      <div class="audit-info">
        <p>
          <span class="label">申请类型：</span>
          <el-tag :type="currentRow?.applyType === '教练移交' ? 'warning' : 'primary'" size="small">
            {{ currentRow?.applyType || '学员申请' }}
          </el-tag>
        </p>
        <p><span class="label">学员：</span>{{ currentRow?.studentName }}</p>
        <p v-if="currentRow?.applyType === '教练移交'">
          <span class="label">由 {{ currentRow?.sourceCoachName }} 发起移交</span>
        </p>
        <p><span class="label">目标教练：</span>{{ currentRow?.coachName }}</p>
        <p v-if="currentRow?.transferReason">
          <span class="label">原因：</span>{{ currentRow?.transferReason }}
        </p>
      </div>
      <el-form :model="auditForm" label-width="80px" style="margin-top: 16px" v-if="!auditForm.pass">
        <el-form-item label="拒绝原因">
          <el-input v-model="auditForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" maxlength="200" show-word-limit />
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
import { Refresh, Search, ArrowRight } from '@element-plus/icons-vue'
import { getCoachApplications, auditApplication } from '@/api/coach'

const appList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })

const searchForm = reactive({
  status: undefined,
  keyword: '',
  applyType: undefined,
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

    let records = res.records || []
    let rawTotal = res.total || 0

    // 前端按申请类型二次过滤（后端暂不区分）
    if (searchForm.applyType === 'student') {
      records = records.filter(r => r.sourceCoachId == null)
      rawTotal = records.length
    } else if (searchForm.applyType === 'transfer') {
      records = records.filter(r => r.sourceCoachId != null)
      rawTotal = records.length
    }
    appList.value = records
    total.value = rawTotal
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
  searchForm.applyType = undefined
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
    const res = await auditApplication(auditForm.id, auditForm.pass, auditForm.reason)
    if (auditForm.pass) {
      // 通过时检查是否有被取消的约课
      const cancelled = res?.cancelledCount || 0
      if (cancelled > 0) {
        const details = (res?.cancelledAppointments || [])
          .map(a => formatTimeRange(a.startTime, a.endTime))
          .join('<br/>')
        ElMessageBox.alert(
          `已自动取消学员与原教练（${res?.oldCoachName}）的 ${cancelled} 条进行中约课，排班名额已释放：<br/><br/>${details}`,
          '审核通过 — 附带清理',
          { dangerouslyUseHTMLString: true, type: 'success' }
        )
      } else {
        ElMessage.success('审核已通过')
      }
    } else {
      ElMessage.success('已拒绝')
    }
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function formatTimeRange(start, end) {
  if (!start || !end) return '-'
  let s = start.replace('T', ' ')
  let e = end.replace('T', ' ')
  // 如果同一天，只显示日期一次
  const sDate = s.substring(0, 10), eDate = e.substring(0, 10)
  if (sDate === eDate) {
    return `${sDate} ${s.substring(11, 16)} ~ ${e.substring(11, 16)}`
  }
  return `${s.substring(0, 16)} ~ ${e.substring(0, 16)}`
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
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  :deep(.el-form-item) { margin-bottom: 0; }
}
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.audit-info {
  p {
    margin: 6px 0;
    .label { color: #909399; font-weight: 500; }
  }
}
</style>
