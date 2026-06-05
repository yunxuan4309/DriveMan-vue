<template>
  <div class="schedule-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班审核</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="scheduleList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="教练" width="100" align="center">
          <template #default="{ row }">{{ row.coachName || row.coachId }}</template>
        </el-table-column>
        <el-table-column label="车牌号" width="120">
          <template #default="{ row }">{{ row.plateNumber || '-' }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venueName || '-' }}</template>
        </el-table-column>
        <el-table-column label="车型" width="70" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.licenseType }}</el-tag></template>
        </el-table-column>
        <el-table-column label="开始时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="名额" width="60" align="center">
          <template #default="{ row }">{{ row.maxStudents }}</template>
        </el-table-column>
        <el-table-column label="申请说明" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.applyReason || '-' }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="150" align="center">
          <template #default="{ row }">{{ formatDateTime(row.applyTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAudit(row, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handleAudit(row, 2)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && scheduleList.length === 0" description="暂无待审核排班" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="dialogVisible" :title="auditForm.status === 1 ? '通过排班' : '拒绝排班'" width="450px" destroy-on-close>
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.status === 1 ? 'success' : 'danger'">
            {{ auditForm.status === 1 ? '通过' : '拒绝' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" :placeholder="auditForm.status === 2 ? '请填写拒绝原因' : '可选备注'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :type="auditForm.status === 1 ? 'success' : 'danger'" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getPendingSchedules, auditSchedule } from '@/api/schedule'

const scheduleList = ref([])
const loading = ref(false)
const currentId = ref(null)
const dialogVisible = ref(false)
const auditForm = reactive({ status: 1, remark: '' })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingSchedules()
    scheduleList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取待审核排班失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAudit(row, status) {
  currentId.value = row.id
  auditForm.status = status
  auditForm.remark = ''
  dialogVisible.value = true
}

async function handleAuditSubmit() {
  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('拒绝时请填写原因')
    return
  }
  auditLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('status', auditForm.status)
    if (auditForm.remark) params.append('remark', auditForm.remark)
    await auditSchedule(currentId.value, params)
    ElMessage.success(auditForm.status === 1 ? '已通过' : '已拒绝')
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

function formatDateTime(dt) {
  return dt ? new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
