<template>
  <div class="license-upgrade">
    <!-- 提交增驾申请 -->
    <el-card>
      <template #header>
        <span>提交增驾申请</span>
      </template>
      <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="120px">
        <el-form-item label="增驾类型" prop="upgradeType">
          <el-radio-group v-model="applyForm.upgradeType">
            <el-radio :value="1">同级增驾 <span style="color: #909399; font-size: 12px">（同级别内切换车型）</span></el-radio>
            <el-radio :value="2">升级增驾 <span style="color: #909399; font-size: 12px">（跨级别升级，需上传驾驶证材料）</span></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标准驾车型" prop="targetLicense">
          <el-select v-model="applyForm.targetLicense" placeholder="请选择目标车型" style="width: 200px">
            <el-option-group label="小型汽车">
              <el-option label="C1" value="C1" />
              <el-option label="C2" value="C2" />
              <el-option label="C5" value="C5" />
              <el-option label="C6" value="C6" />
            </el-option-group>
            <el-option-group label="中型/大型货车">
              <el-option label="B1" value="B1" />
              <el-option label="B2" value="B2" />
            </el-option-group>
            <el-option-group label="大型客车/城市公交">
              <el-option label="A1" value="A1" />
              <el-option label="A3" value="A3" />
            </el-option-group>
            <el-option-group label="摩托车">
              <el-option label="D" value="D" />
              <el-option label="E" value="E" />
              <el-option label="F" value="F" />
            </el-option-group>
            <el-option-group label="特种车辆">
              <el-option label="M" value="M" />
              <el-option label="N" value="N" />
              <el-option label="P" value="P" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <!-- 驾驶证材料上传（升级增驾时） -->
        <el-form-item label="驾驶证材料" v-if="applyForm.upgradeType === 2" prop="licenseFileId">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button type="primary" plain>
              {{ licenseFileName || '选择文件' }}
            </el-button>
            <template #tip>
              <div style="color: #909399; font-size: 12px; margin-top: 4px">
                支持 JPG/PNG/PDF 格式；升级增驾必须上传驾驶证材料
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleApply" :loading="applyLoading">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的增驾申请记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>我的增驾申请</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
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
        <el-table-column label="考试状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" :type="getExamStatusTag(row.examStatus)" size="small">
              {{ getExamStatusText(row.examStatus) }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无增驾申请记录" style="margin-top: 30px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { uploadFile } from '@/api/file'
import { applyLicenseUpgrade, getMyLicenseUpgrades } from '@/api/licenseUpgrade'

const userStore = useUserStore()

const recordList = ref([])
const loading = ref(false)

// 申请表单
const applyFormRef = ref()
const applyForm = reactive({ targetLicense: '', upgradeType: 1, licenseFileId: null })
const applyLoading = ref(false)
const licenseFileName = ref('')

const applyRules = {
  targetLicense: [{ required: true, message: '请选择目标准驾车型', trigger: 'change' }],
  upgradeType: [{ required: true, message: '请选择增驾类型', trigger: 'change' }],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getMyLicenseUpgrades()
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取增驾记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleFileChange(uploadFile) {
  licenseFileName.value = uploadFile.name
  applyForm.licenseFileId = null // will set after upload
  // 暂存文件对象，提交时上传
  applyForm._file = uploadFile.raw
}

async function handleApply() {
  const valid = await applyFormRef.value.validate().catch(() => false)
  if (!valid) return

  // 如果选择了文件，先上传
  let licenseFileId = null
  if (applyForm._file) {
    applyLoading.value = true
    try {
      const uploadRes = await uploadFile(userStore.userId, applyForm._file, 'image', 'license_upgrade')
      licenseFileId = uploadRes?.fileId || uploadRes?.id || uploadRes
    } catch (error) {
      console.error('上传驾驶证材料失败:', error)
      ElMessage.error('驾驶证材料上传失败')
      applyLoading.value = false
      return
    }
  }

  applyLoading.value = true
  try {
    const data = {
      targetLicense: applyForm.targetLicense,
      upgradeType: applyForm.upgradeType,
    }
    if (licenseFileId) {
      data.licenseFileId = licenseFileId
    }
    await applyLicenseUpgrade(data)
    ElMessage.success('增驾申请已提交')
    applyForm.targetLicense = ''
    applyForm.upgradeType = 1
    applyForm.licenseFileId = null
    applyForm._file = null
    licenseFileName.value = ''
    fetchList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    applyLoading.value = false
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

function getExamStatusTag(examStatus) {
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[examStatus] || 'info'
}

function getExamStatusText(examStatus) {
  const map = { 0: '待考试', 1: '考试通过', 2: '考试不通过' }
  return map[examStatus] || '-'
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

.text-gray {
  color: #909399;
}
</style>
