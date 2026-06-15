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
          <el-button type="primary" @click="handleApply(false)" :loading="applyLoading">提交申请</el-button>
          <el-button v-if="applyForm.upgradeType === 2" type="warning" @click="handleApply(true)" :loading="demoLoading">演示申请(跳过驾龄)</el-button>
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
        <el-table-column label="缴费状态" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 1 && row.examStatus !== 1">
              <el-tag v-if="row._payStatus === 'paid'" type="success" size="small">已缴费</el-tag>
              <el-tag v-else-if="row._payStatus === 'unpaid'" type="danger" size="small">待缴费</el-tag>
              <span v-else class="text-gray">-</span>
            </template>
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
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 1 && row.examStatus !== 1">
              <el-button v-if="row._payStatus === 'unpaid'" type="warning" size="small" @click="handlePay(row)">
                去缴费
              </el-button>
              <el-button v-else-if="row._payStatus === 'paid'" type="primary" size="small" @click="goExamRegister">
                去报名考试
              </el-button>
              <el-tag v-else type="info" size="small">处理中</el-tag>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 当前进行中的增驾进度指引 -->
      <template v-if="activeUpgrade">
        <el-divider />
        <div class="progress-guide">
          <h4>当前增驾进度（{{ activeUpgrade.originalLicense }} → {{ activeUpgrade.targetLicense }}）</h4>
          <el-steps :active="activeStepIndex" align-center style="margin: 20px 0">
            <el-step title="提交申请" description="已提交" />
            <el-step title="审核通过" :description="activeUpgrade.status === 1 ? '已通过' : '待审核'" />
            <el-step title="缴纳增驾费" :description="activeUpgrade._payStatus === 'paid' ? '已缴费' : '待缴费'" />
            <el-step title="参加考试" description="未免考科目" />
            <el-step title="完成增驾" description="更新车型" />
          </el-steps>

          <el-alert
            :type="activeAlertType"
            :title="activeAlertTitle"
            :description="activeAlertDesc"
            show-icon
            :closable="false"
            style="margin-top: 10px"
          />
        </div>
      </template>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无增驾申请记录" style="margin-top: 30px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { uploadFile } from '@/api/file'
import { applyLicenseUpgrade, getMyLicenseUpgrades } from '@/api/licenseUpgrade'
import { getMyPaymentRecords, payMyPaymentRecord } from '@/api/payment'

const router = useRouter()
const userStore = useUserStore()

const recordList = ref([])
const paymentMap = ref({})
const loading = ref(false)

// 申请表单
const applyFormRef = ref()
const applyForm = reactive({ targetLicense: '', upgradeType: 1, licenseFileId: null })
const applyLoading = ref(false)
const demoLoading = ref(false)
const licenseFileName = ref('')

const applyRules = {
  targetLicense: [{ required: true, message: '请选择目标准驾车型', trigger: 'change' }],
  upgradeType: [{ required: true, message: '请选择增驾类型', trigger: 'change' }],
}

// ====== 进度指引 ======

const activeUpgrade = computed(() => {
  return recordList.value.find(r => r.status === 1 && r.examStatus !== 1) || null
})

const activeStepIndex = computed(() => {
  if (!activeUpgrade.value) return 0
  const r = activeUpgrade.value
  if (r.status !== 1) return 1 // 待审核
  if (r._payStatus !== 'paid') return 2 // 待缴费
  return 3 // 待考试
})

const activeAlertType = computed(() => {
  if (!activeUpgrade.value) return 'info'
  const r = activeUpgrade.value
  if (r._payStatus !== 'paid') return 'warning'
  return 'primary'
})

const activeAlertTitle = computed(() => {
  if (!activeUpgrade.value) return ''
  const r = activeUpgrade.value
  if (r._payStatus !== 'paid') return '请缴纳增驾套餐费'
  if (r.skipSubjects) return '免考科目' + r.skipSubjects + '，其余科目请报名考试'
  return '请报名参加全部科目考试'
})

const activeAlertDesc = computed(() => {
  if (!activeUpgrade.value) return ''
  const r = activeUpgrade.value
  if (r._payStatus !== 'paid') return '增驾申请已通过审核，请先缴纳增驾费用后再进行考试报名'
  if (r.skipSubjects) return '以下科目已免考通过：科目' + r.skipSubjects.split(',').join('、') + '。请到"考试报名"处预约未免考科目的考试场次'
  return '请到"考试报名"处预约各科目考试场次'
})

// ====== 方法 ======

async function fetchList() {
  loading.value = true
  try {
    const [upgrades, payments] = await Promise.all([
      getMyLicenseUpgrades(),
      getMyPaymentRecords().catch(() => []),
    ])

    const list = Array.isArray(upgrades) ? upgrades : []
    const payArr = Array.isArray(payments) ? payments : []

    // 构建 paymentMap: license_upgrade_id → status
    const pmap = {}
    payArr.forEach(p => {
      if (p.bizType === 'upgrade_fee' && p.bizId) {
        pmap[p.bizId] = pmap[p.bizId] || []
        pmap[p.bizId].push(p)
      }
    })
    paymentMap.value = pmap

    // 富化每行记录的支付状态
    list.forEach(r => {
      const pays = pmap[r.id] || []
      const paid = pays.some(p => p.status === 1)
      r._payStatus = paid ? 'paid' : (pays.length > 0 ? 'unpaid' : 'unknown')
    })

    recordList.value = list
  } catch (error) {
    console.error('获取增驾记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

function handleFileChange(uploadFile) {
  licenseFileName.value = uploadFile.name
  applyForm.licenseFileId = null
  applyForm._file = uploadFile.raw
}

async function handleApply(skipAgeCheck = false) {
  const valid = await applyFormRef.value.validate().catch(() => false)
  if (!valid) return

  const loading = skipAgeCheck ? demoLoading : applyLoading
  loading.value = true
  try {
    let licenseFileId = null
    if (applyForm._file) {
      try {
        const uploadRes = await uploadFile(userStore.userId, applyForm._file, 'image', 'license_upgrade')
        licenseFileId = uploadRes?.fileId || uploadRes?.id || uploadRes
      } catch (error) {
        console.error('上传驾驶证材料失败:', error)
        ElMessage.error('驾驶证材料上传失败')
        loading.value = false
        return
      }
    }

    const data = {
      targetLicense: applyForm.targetLicense,
      upgradeType: applyForm.upgradeType,
    }
    if (licenseFileId) data.licenseFileId = licenseFileId
    if (skipAgeCheck) data.skipAgeCheck = true

    await applyLicenseUpgrade(data)
    ElMessage.success(skipAgeCheck ? '演示申请已提交（已跳过驾龄校验）' : '增驾申请已提交')
    applyForm.targetLicense = ''
    applyForm.upgradeType = 1
    applyForm.licenseFileId = null
    applyForm._file = null
    licenseFileName.value = ''
    fetchList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    loading.value = false
  }
}

async function handlePay(row) {
  try {
    const pays = paymentMap.value[row.id] || []
    const pending = pays.find(p => p.status === 0)
    if (pending) {
      await payMyPaymentRecord(pending.id)
      ElMessage.success('增驾费已支付成功')
      fetchList()
    } else {
      ElMessage.info('暂无待支付的增驾账单，请联系管理员')
    }
  } catch (error) {
    console.error('支付失败:', error)
  }
}

function goExamRegister() {
  router.push('/student/exam-registration')
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
.progress-guide {
  padding: 0 10px 10px;
}
.progress-guide h4 {
  margin: 0 0 10px;
  color: #303133;
}
</style>
