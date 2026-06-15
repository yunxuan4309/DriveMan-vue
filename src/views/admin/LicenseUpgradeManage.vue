<template>
  <div class="admin-license-upgrade">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>增驾申请管理</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="学员姓名">
          <el-input v-model="searchForm.keyword" placeholder="学员姓名" clearable style="width: 130px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="原车型">
          <el-select v-model="searchForm.originalLicense" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标车型">
          <el-select v-model="searchForm.targetLicense" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px" @change="fetchList">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核不通过" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试状态">
          <el-select v-model="searchForm.examStatus" placeholder="全部" clearable style="width: 110px" @change="fetchList">
            <el-option label="增驾中（待考试）" :value="0" />
            <el-option label="已完成" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 220px"
            @change="fetchList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">{{ row.studentName || '-' }}</template>
        </el-table-column>
        <el-table-column label="原车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.originalLicense || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.targetLicense || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="增驾类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.upgradeType === 1" size="small" type="success">同级增驾</el-tag>
            <el-tag v-else size="small" type="warning">升级增驾</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试进度" width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 1">
              <template v-if="row.examStatus === 1">
                <el-tag type="success" size="small">已完成</el-tag>
              </template>
              <template v-else>
                <div style="font-size: 12px">
                  <el-tag v-if="row.skipSubjects" type="info" size="small" style="margin: 1px">免{{ row.skipSubjects }}</el-tag>
                  <span style="color: #909399">待考试</span>
                </div>
              </template>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="免考科目" width="90" align="center">
          <template #default="{ row }">
            <template v-if="row.skipSubjects">
              <el-tag v-for="s in (row.skipSubjects || '').split(',')" :key="s" size="small" style="margin: 1px">
                科目{{ s }}
              </el-tag>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary" size="small" @click="handleAudit(row)">审核</el-button>
            <el-button
              v-if="row.status === 1 && row.examStatus !== 1"
              type="success" size="small" @click="handleComplete(row)">完成增驾</el-button>
            <span v-else-if="row.status !== 0" class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无增驾申请" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核增驾申请" width="480px" destroy-on-close>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="学员姓名">
          <span>{{ currentRow?.studentName }}</span>
        </el-form-item>
        <el-form-item label="增驾信息">
          <span>{{ currentRow?.originalLicense }} → {{ currentRow?.targetLicense }}</span>
        </el-form-item>
        <el-form-item label="增驾类型">
          <el-tag v-if="currentRow?.upgradeType === 1" size="small" type="success">同级增驾</el-tag>
          <el-tag v-else size="small" type="warning">升级增驾</el-tag>
        </el-form-item>
        <el-form-item label=" ">
          <el-alert
            v-if="auditForm.status === 1 && getSkipSuggestion(currentRow)"
            :title="getSkipSuggestion(currentRow)"
            type="info"
            show-icon
            :closable="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="免考科目" v-if="auditForm.status === 1">
          <el-checkbox-group v-model="auditForm.skipSubjects" :max="3">
            <el-checkbox label="1">科目一</el-checkbox>
            <el-checkbox label="2">科目二</el-checkbox>
            <el-checkbox label="3">科目三</el-checkbox>
            <el-checkbox label="4">科目四</el-checkbox>
          </el-checkbox-group>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            勾选的科目免考（直接算通过），至少保留一科进行考试
          </div>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" :placeholder="auditForm.status === 2 ? '请填写不通过原因' : '可选备注'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 录入考试成绩对话框（已移除：增驾考试须通过统一考试报名系统） -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import {
  getAllLicenseUpgrades,
  auditLicenseUpgrade,
  getUpgradeProgress,
  completeLicenseUpgrade,
} from '@/api/licenseUpgrade'

const recordList = ref([])
const loading = ref(false)
const total = ref(0)

const searchForm = reactive({
  page: 1, size: 10, keyword: '', originalLicense: '', targetLicense: '',
  status: undefined, examStatus: undefined, dateRange: null,
})

import { LICENSE_TYPES } from '@/config/license'

const currentRow = ref(null)

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({ status: 1, remark: '', skipSubjects: [] })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.originalLicense) params.originalLicense = searchForm.originalLicense
    if (searchForm.targetLicense) params.targetLicense = searchForm.targetLicense
    if (searchForm.status !== undefined && searchForm.status !== null) params.status = searchForm.status
    if (searchForm.examStatus !== undefined && searchForm.examStatus !== null) params.examStatus = searchForm.examStatus
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.createTimeStart = searchForm.dateRange[0]
      params.createTimeEnd = searchForm.dateRange[1]
    }
    const res = await getAllLicenseUpgrades(params)
    recordList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取增驾记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.page = 1
  searchForm.keyword = ''
  searchForm.originalLicense = ''
  searchForm.targetLicense = ''
  searchForm.status = undefined
  searchForm.examStatus = undefined
  searchForm.dateRange = null
  fetchList()
}

function handleSizeChange() {
  searchForm.page = 1
  fetchList()
}

function handleAudit(row) {
  currentRow.value = row
  auditForm.status = 1
  auditForm.remark = ''
  auditForm.skipSubjects = []
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('审核不通过时请填写备注原因')
    return
  }
  auditLoading.value = true
  try {
    const data = { status: auditForm.status }
    if (auditForm.remark) data.remark = auditForm.remark
    if (auditForm.skipSubjects && auditForm.skipSubjects.length > 0) {
      data.skipSubjects = auditForm.skipSubjects.join(',')
    }
    await auditLicenseUpgrade(currentRow.value.id, data)
    const msg = auditForm.status === 1
      ? (auditForm.skipSubjects.length > 0
        ? '审核已通过（已跳过科目' + auditForm.skipSubjects.join('、') + '）'
        : '审核已通过')
      : '已拒绝申请'
    ElMessage.success(msg)
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(
      `确认完成 [${row.studentName}] 的增驾申请（${row.originalLicense} → ${row.targetLicense}）？` +
      '\n系统将检查：①增驾费已支付  ②所有未免考科目已通过考试',
      '完成增驾', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' }
    )
    const loading = ElLoading.service({ fullscreen: true, text: '正在检查条件...' })
    try {
      await completeLicenseUpgrade(row.id)
      loading.close()
      ElMessage.success('增驾已完成，学员车型已更新')
      fetchList()
    } catch (err) {
      loading.close()
      throw err
    }
  } catch (error) {
    if (error?.toString().includes('cancel') || error?.toString().includes('Cancel')) return
    // 尝试获取详细信息
    try {
      const progress = await getUpgradeProgress(row.id)
      const subjects = progress.pendingSubjects || []
      if (!progress.paid) {
        ElMessage.warning('学员尚未支付增驾费，请先完成缴费')
      } else if (subjects.length > 0) {
        ElMessage.warning('以下科目尚未通过考试：科目' + subjects.join('、') + '，请先安排学员参加考试')
      } else {
        ElMessage.error(error?.message || '完成增驾失败')
      }
    } catch {
      ElMessage.error(error?.message || '完成增驾失败')
    }
  }
}

function getStatusTag(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getSkipSuggestion(row) {
  if (!row) return ''
  if (row.upgradeType === 1) {
    if (row.originalLicense === 'C1' && row.targetLicense === 'C6') {
      return '提示：C1→C6 增驾通常免考科目一和科目四，建议勾选'
    }
    return '提示：同级增驾通常免考科目一（理论），建议勾选'
  }
  return '提示：升级增驾通常需考全部科目，无默认免考建议'
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
  margin-bottom: 10px;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.text-gray {
  color: #909399;
}
</style>
