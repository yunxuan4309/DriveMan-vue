<template>
  <div class="coach-application-review">
    <el-card>
      <template #header>
        <span>教练申请审核</span>
      </template>

      <el-table :data="appList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="100" />
        <el-table-column prop="coachName" label="教练姓名" width="100" />
        <el-table-column prop="vehicleType" label="准教车型" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleAudit(row, true)">通过</el-button>
              <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && appList.length === 0" description="暂无待审核申请" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核教练申请" width="400px" destroy-on-close>
      <p><strong>审核结果：</strong>
        <el-tag :type="auditForm.pass ? 'success' : 'danger'">
          {{ auditForm.pass ? '通过' : '拒绝' }}
        </el-tag>
      </p>
      <el-form :model="auditForm" label-width="60px" style="margin-top: 16px">
        <el-form-item label="原因" v-if="!auditForm.pass">
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingApplications, auditApplication } from '@/api/coach'

const appList = ref([])
const loading = ref(false)

const auditDialogVisible = ref(false)
const auditForm = ref({ id: undefined, pass: true, reason: '' })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingApplications()
    appList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取待审核申请失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAudit(row, pass) {
  auditForm.value = { id: row.id, pass, reason: '' }
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (!auditForm.value.pass && !auditForm.value.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  auditLoading.value = true
  try {
    await auditApplication(auditForm.value.id, auditForm.value.pass, auditForm.value.reason)
    ElMessage.success(auditForm.value.pass ? '已通过' : '已拒绝')
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
.text-gray { color: #909399; }
</style>
