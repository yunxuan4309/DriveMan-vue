<template>
  <div class="registration-review">
    <el-card>
      <template #header>
        <span>报名审核</span>
      </template>

      <el-table :data="pendingList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="licenseType" label="驾照类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.role === 0 ? 'warning' : 'info'">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.role === 0" size="small" type="warning">首次报名审核</el-tag>
            <el-tag v-else size="small" type="info">学员审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="handleAudit(row, true)">
              通过
            </el-button>
            <el-button link type="danger" size="small" @click="handleAudit(row, false)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && pendingList.length === 0" description="暂无待审核报名" style="margin-top: 40px" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核报名" width="450px" destroy-on-close>
      <div class="audit-info">
        <p><strong>学员：</strong>{{ currentUser.realName }} ({{ currentUser.username }})</p>
        <p><strong>身份证号：</strong>{{ currentUser.idCard }}</p>
        <p><strong>手机号：</strong>{{ currentUser.phone }}</p>
        <p><strong>驾照类型：</strong>{{ currentUser.licenseType }}</p>
      </div>
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.pass ? 'success' : 'danger'">
            {{ auditForm.pass ? '通过' : '不通过' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="原因" v-if="!auditForm.pass">
          <el-input v-model="auditForm.reason" type="textarea" rows="3" placeholder="请输入不通过原因" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingRegistrations, auditRegistration } from '@/api/user'

const pendingList = ref([])
const loading = ref(false)

const auditDialogVisible = ref(false)
const currentUser = ref({})
const auditForm = ref({ pass: true, reason: '' })
const auditLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingRegistrations()
    pendingList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取待审核列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAudit(row, pass) {
  currentUser.value = row
  auditForm.value = { pass, reason: '' }
  auditDialogVisible.value = true
}

async function handleAuditSubmit() {
  if (!auditForm.value.pass && !auditForm.value.reason) {
    ElMessage.warning('请输入不通过原因')
    return
  }
  auditLoading.value = true
  try {
    await auditRegistration(currentUser.value.userId, auditForm.value.pass, auditForm.value.reason)
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
.audit-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  p { margin: 8px 0; }
}
</style>
