<template>
  <div class="coach-registration-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教练注册审核</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="不通过" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/姓名/手机号/身份证号" clearable style="width: 250px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="准教车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 200px">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column label="准教车型" width="140">
          <template #default="{ row }">
            <el-tag v-for="type in (row.vehicleType || '').split(',')" :key="type" size="small" style="margin-right: 4px">
              {{ type }}
            </el-tag>
            <span v-if="!row.vehicleType" class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="coachYears" label="教龄" width="80" align="center">
          <template #default="{ row }">
            {{ row.coachYears ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" link type="success" size="small" @click="handleAudit(row)">
              <el-icon><Check /></el-icon>审核
            </el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="教练注册详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="真实姓名">{{ currentRow.realName }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentRow.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentRow.idCard }}</el-descriptions-item>
        <el-descriptions-item label="准教车型">
          <template v-if="currentRow.vehicleType">
            <el-tag v-for="type in currentRow.vehicleType.split(',')" :key="type" size="small" style="margin-right: 4px">
              {{ type }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="教龄">{{ currentRow.coachYears ?? '-' }} 年</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRow.status)">{{ getStatusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="审核原因" :span="2" v-if="currentRow.auditReason">
          <span class="text-danger">{{ currentRow.auditReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核教练注册" width="500px">
      <div class="audit-info">
        <p><strong>姓名：</strong>{{ currentRow.realName }} ({{ currentRow.username }})</p>
        <p><strong>身份证号：</strong>{{ currentRow.idCard }}</p>
        <p><strong>准教车型：</strong>{{ currentRow.vehicleType || '-' }}</p>
      </div>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果" prop="pass">
          <el-radio-group v-model="auditForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="原因" prop="reason" v-if="auditForm.pass === false">
          <el-input v-model="auditForm.reason" type="textarea" rows="3" placeholder="请输入不通过原因" maxlength="200" show-word-limit />
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
import { Search, View, Check } from '@element-plus/icons-vue'
import { getCoachRegistrations, auditCoachRegistration } from '@/api/coach'
import { LICENSE_TYPES } from '@/config/license'

// 搜索表单
const searchForm = reactive({
  status: undefined,
  keyword: '',
  licenseType: '',
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
})

// 数据列表
const list = ref([])
const loading = ref(false)

// 详情对话框
const viewDialogVisible = ref(false)
const currentRow = ref({})

// 审核对话框
const auditDialogVisible = ref(false)
const auditForm = reactive({
  userId: undefined,
  pass: true,
  reason: '',
})
const auditLoading = ref(false)

// 获取列表
async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm,
    }
    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })
    const res = await getCoachRegistrations(params)
    list.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取教练注册列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchList()
}

// 重置
function handleReset() {
  searchForm.status = undefined
  searchForm.keyword = ''
  searchForm.licenseType = ''
  pagination.page = 1
  fetchList()
}

// 分页
function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchList()
}

function handlePageChange(page) {
  pagination.page = page
  fetchList()
}

// 查看详情
function handleView(row) {
  currentRow.value = row
  viewDialogVisible.value = true
}

// 打开审核对话框
function handleAudit(row) {
  currentRow.value = row
  auditForm.userId = row.userId
  auditForm.pass = true
  auditForm.reason = ''
  auditDialogVisible.value = true
}

// 提交审核
async function handleAuditSubmit() {
  if (!auditForm.pass && !auditForm.reason) {
    ElMessage.warning('请输入不通过原因')
    return
  }
  auditLoading.value = true
  try {
    await auditCoachRegistration(auditForm.userId, auditForm.pass, auditForm.reason)
    ElMessage.success(auditForm.pass ? '审核通过' : '已拒绝')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

// 状态映射
function getStatusLabel(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '不通过' }
  return map[status] || '未知'
}

function getStatusType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.coach-registration-review {
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

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .audit-info {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .text-gray {
    color: #909399;
  }

  .text-danger {
    color: #f56c6c;
  }
}
</style>
