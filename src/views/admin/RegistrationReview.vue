<template>
  <div class="registration-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报名审核</span>
          <el-button text type="primary" :icon="Refresh" @click="fetchList">刷新</el-button>
        </div>
      </template>

      <el-table :data="pendingList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="licenseType" label="驾照类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="warning">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="残疾审核" width="120" align="center">
          <template #default="{ row }">
            <div v-if="disabilityMap[row.userId]">
              <el-tag v-if="disabilityMap[row.userId].auditStatus === 0" size="small" type="warning">待审核</el-tag>
              <el-tag v-else-if="disabilityMap[row.userId].auditStatus === 1" size="small" type="success">已通过</el-tag>
              <el-tag v-else-if="disabilityMap[row.userId].auditStatus === 2" size="small" type="danger">已拒绝</el-tag>
            </div>
            <span v-else class="text-gray">未提交</span>
          </template>
        </el-table-column>
        <el-table-column label="残疾证" width="80" align="center">
          <template #default="{ row }">
            <el-button
              v-if="disabilityMap[row.userId] && disabilityMap[row.userId].certificateFileId"
              link type="primary" size="small"
              @click="previewFile(disabilityMap[row.userId].certificateFileId)"
            >查看</el-button>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <template v-if="disabilityMap[row.userId] && disabilityMap[row.userId].auditStatus === 0">
              <el-button link type="primary" size="small" :loading="disabilityLoading[row.userId]" @click="quickApproveDisability(row)">通过残疾</el-button>
              <el-button link type="danger" size="small" @click="handleRejectDisability(row)">拒绝残疾</el-button>
              <el-divider direction="vertical" />
            </template>
            <el-button link type="success" size="small" @click="handleAudit(row, true)">通过报名</el-button>
            <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝报名</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && pendingList.length === 0" description="暂无待审核报名" style="margin-top: 40px" />
    </el-card>

    <!-- 报名审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核报名" width="520px" destroy-on-close>
      <!-- 残疾信息卡片（仅 C5 展示） -->
      <div v-if="currentDisability" class="disability-section">
        <h4 class="section-title">残疾信息 <el-tag v-if="currentDisability.auditStatus === 0" size="small" type="warning">待审核</el-tag>
          <el-tag v-else-if="currentDisability.auditStatus === 1" size="small" type="success">已通过</el-tag>
          <el-tag v-else-if="currentDisability.auditStatus === 2" size="small" type="danger">已拒绝</el-tag></h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="残疾类型">{{ disabilityTypeMap[currentDisability.disabilityType] || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="残疾人证号">{{ currentDisability.certificateNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="证件扫描件" :span="2">
            <el-button v-if="currentDisability.certificateFileId" link type="primary" size="small" @click="previewFile(currentDisability.certificateFileId)">点击查看</el-button>
            <span v-else class="text-gray">-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 学员基本信息 -->
      <div class="audit-info">
        <h4 class="section-title">学员信息</h4>
        <p><strong>姓名：</strong>{{ currentUser.realName }} ({{ currentUser.username }})</p>
        <p><strong>身份证号：</strong>{{ currentUser.idCard }}</p>
        <p><strong>手机号：</strong>{{ currentUser.phone }}</p>
        <p><strong>驾照类型：</strong>{{ currentUser.licenseType }}</p>
      </div>

      <!-- 报名审核 -->
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.pass ? 'success' : 'danger'">
            {{ auditForm.pass ? '通过报名' : '拒绝报名' }}
          </el-tag>
        </el-form-item>
        <el-form-item v-if="!auditForm.pass" label="原因">
          <el-input v-model="auditForm.reason" type="textarea" rows="3" placeholder="请输入不通过原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝残疾审核对话框 -->
    <el-dialog v-model="rejectDisabilityVisible" title="拒绝残疾审核" width="400px" destroy-on-close>
      <el-form :model="rejectDisabilityForm" label-width="80px">
        <el-form-item label="学员姓名">
          <span>{{ rejectDisabilityTarget?.realName }}</span>
        </el-form-item>
        <el-form-item label="残疾类型">
          <span>{{ rejectDisabilityTarget ? (disabilityTypeMap[disabilityMap[rejectDisabilityTarget.userId]?.disabilityType] || '未知') : '' }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectDisabilityForm.remark" type="textarea" rows="3" placeholder="请填写拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDisabilityVisible = false">取消</el-button>
        <el-button type="danger" @click="handleRejectDisabilitySubmit" :loading="rejectDisabilityLoading">拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getPendingRegistrations, auditRegistration } from '@/api/user'
import { getDisabilityInfoByUserId, auditDisabilityInfo } from '@/api/disabilityInfo'
import { useFilePreview } from '@/composables/useFilePreview'

const disabilityTypeMap = {
  1: '右下肢残疾', 2: '双下肢残疾', 3: '右手残疾',
  4: '听力障碍', 5: '左手残疾', 9: '其他',
}

const pendingList = ref([])
const loading = ref(false)
const disabilityMap = ref({})         // userId → disabilityInfo
const disabilityLoading = ref({})     // userId → boolean

// 报名审核
const auditDialogVisible = ref(false)
const currentUser = ref({})
const currentDisability = ref(null)
const auditForm = ref({ pass: true, reason: '' })
const auditLoading = ref(false)

// 拒绝残疾审核
const rejectDisabilityVisible = ref(false)
const rejectDisabilityTarget = ref(null)
const rejectDisabilityForm = ref({ remark: '' })
const rejectDisabilityLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingRegistrations()
    pendingList.value = Array.isArray(res) ? res : []

    // 批量加载残疾信息
    disabilityMap.value = {}
    const promises = pendingList.value.map(async (user) => {
      try {
        const info = await getDisabilityInfoByUserId(user.userId)
        disabilityMap.value[user.userId] = info
      } catch {
        // 未提交残疾信息 → 不加入 map
      }
    })
    await Promise.all(promises)
  } catch (error) {
    console.error('获取待审核列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAudit(row, pass) {
  currentUser.value = row
  currentDisability.value = disabilityMap.value[row.userId] || null
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
    ElMessage.success(auditForm.value.pass ? '报名已通过' : '报名已拒绝')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

/** 一键通过残疾审核 */
async function quickApproveDisability(row) {
  const info = disabilityMap.value[row.userId]
  if (!info) return

  try {
    await ElMessageBox.confirm(
      `确认通过「${row.realName}」的残疾信息审核？`,
      '通过残疾审核',
      { type: 'info' }
    )
    disabilityLoading.value = { ...disabilityLoading.value, [row.userId]: true }
    await auditDisabilityInfo(info.id, 1, '')
    ElMessage.success('残疾信息审核已通过')
    // 刷新残疾信息状态
    const updated = await getDisabilityInfoByUserId(row.userId)
    disabilityMap.value = { ...disabilityMap.value, [row.userId]: updated }
  } catch (error) {
    if (error !== 'cancel') console.error('残疾审核失败:', error)
  } finally {
    disabilityLoading.value = { ...disabilityLoading.value, [row.userId]: false }
  }
}

/** 拒绝残疾审核 — 弹窗填原因 */
function handleRejectDisability(row) {
  rejectDisabilityTarget.value = row
  rejectDisabilityForm.value = { remark: '' }
  rejectDisabilityVisible.value = true
}

async function handleRejectDisabilitySubmit() {
  if (!rejectDisabilityForm.value.remark) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  const info = disabilityMap.value[rejectDisabilityTarget.value.userId]
  if (!info) return

  rejectDisabilityLoading.value = true
  try {
    await auditDisabilityInfo(info.id, 2, rejectDisabilityForm.value.remark)
    ElMessage.success('残疾信息已拒绝')
    rejectDisabilityVisible.value = false
    // 刷新残疾信息状态
    const updated = await getDisabilityInfoByUserId(rejectDisabilityTarget.value.userId)
    disabilityMap.value = { ...disabilityMap.value, [rejectDisabilityTarget.value.userId]: updated }
  } catch (error) {
    console.error('拒绝残疾信息失败:', error)
  } finally {
    rejectDisabilityLoading.value = false
  }
}

function previewFile(fileId) {
  const { previewFile: doPreview } = useFilePreview()
  doPreview(fileId)
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

.audit-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  p { margin: 8px 0; }
}

.disability-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.text-gray {
  color: #909399;
  font-size: 13px;
}
</style>
