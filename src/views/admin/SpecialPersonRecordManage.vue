<template>
  <div class="admin-special-record">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>特殊人群记录管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="姓名搜索" clearable style="width: 140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="记录类型">
          <el-select v-model="searchForm.recordType" placeholder="全部类型" clearable style="width: 120px" @change="handleSearch">
            <el-option v-for="(label, val) in recordTypeMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待审核" :value="0" />
            <el-option label="通过" :value="1" />
            <el-option label="不通过" :value="2" />
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
          <template #default="{ row }">{{ row.studentName || '-' }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130" align="center">
          <template #default="{ row }">{{ row.studentPhone || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录类型" width="120" align="center">
          <template #default="{ row }">{{ recordTypeMap[row.recordType] || '未知' }}</template>
        </el-table-column>
        <el-table-column label="违法日期" width="110" align="center">
          <template #default="{ row }">{{ row.recordDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="禁驾年限" width="90" align="center">
          <template #default="{ row }">{{ row.banYears != null ? row.banYears + '年' : '终生' }}</template>
        </el-table-column>
        <el-table-column label="文书编号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.courtDocNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="文书扫描件" width="100" align="center">
          <template #default="{ row }">
            <el-button v-if="row.courtDocFileId" link type="primary" size="small" @click="previewFile(row.courtDocFileId)">查看</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="{ 0: 'warning', 1: 'success', 2: 'danger' }[row.auditStatus] || 'info'" size="small">
              {{ { 0: '待审核', 1: '通过', 2: '不通过' }[row.auditStatus] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditRemark || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.auditStatus === 0" type="primary" size="small" @click="handleAudit(row)">审核</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="fetchList"
        />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无特殊人群记录" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核特殊人群记录" width="480px" destroy-on-close>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="学员姓名">
          <span>{{ currentRow?.studentName }}</span>
        </el-form-item>
        <el-form-item label="记录类型">
          <span>{{ currentRow ? (recordTypeMap[currentRow.recordType] || '未知') : '' }}</span>
        </el-form-item>
        <el-form-item label="违法日期">
          <span>{{ currentRow?.recordDate || '-' }}</span>
        </el-form-item>
        <el-form-item label="禁驾年限">
          <span>{{ currentRow?.banYears != null ? currentRow.banYears + '年' : '终生禁驾' }}</span>
        </el-form-item>
        <el-form-item label="文书编号">
          <span>{{ currentRow?.courtDocNo }}</span>
        </el-form-item>
        <el-form-item label="文书扫描件">
          <el-button v-if="currentRow?.courtDocFileId" link type="primary" size="small" @click="previewFile(currentRow.courtDocFileId)">查看</el-button>
          <span v-else class="text-gray">-</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.auditRemark" type="textarea" rows="3" :placeholder="auditForm.auditStatus === 2 ? '请填写不通过原因' : '可选备注'" />
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
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getSpecialRecordPage, auditSpecialRecord } from '@/api/specialPersonRecord'

const recordTypeMap = {
  1: '犯罪记录', 2: '饮酒驾驶', 3: '醉酒驾驶',
  4: '吸毒/毒驾', 5: '交通肇事逃逸', 6: '超速/超员构成犯罪',
}

const recordList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })
const currentRow = ref(null)

const searchForm = reactive({
  keyword: '',
  recordType: undefined,
  auditStatus: undefined,
})

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({ auditStatus: 1, auditRemark: '' })
const auditLoading = ref(false)

function handleSearch() {
  pagination.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.recordType !== undefined && searchForm.recordType !== null && searchForm.recordType !== '') {
      params.recordType = searchForm.recordType
    }
    if (searchForm.auditStatus !== undefined && searchForm.auditStatus !== null && searchForm.auditStatus !== '') {
      params.auditStatus = searchForm.auditStatus
    }
    const res = await getSpecialRecordPage(params)
    recordList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取特殊人群记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.recordType = undefined
  searchForm.auditStatus = undefined
  handleSearch()
}

function handleAudit(row) {
  currentRow.value = row
  auditForm.auditStatus = 1
  auditForm.auditRemark = ''
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (auditForm.auditStatus === 2 && !auditForm.auditRemark) {
    ElMessage.warning('审核不通过时请填写备注原因')
    return
  }
  auditLoading.value = true
  try {
    await auditSpecialRecord(currentRow.value.id, auditForm.auditStatus, auditForm.auditRemark)
    ElMessage.success(auditForm.auditStatus === 1 ? '审核已通过' : '已拒绝申请')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function previewFile(fileId) {
  if (!fileId) return
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9500'
  window.open(baseUrl + '/files/' + fileId + '/download?preview=true', '_blank')
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
.text-gray {
  color: #909399;
}
</style>
