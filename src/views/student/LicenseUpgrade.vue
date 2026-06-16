<template>
  <div class="license-upgrade">
    <!-- 提交增驾申请 -->
    <el-card>
      <template #header>
        <span>提交增驾申请</span>
      </template>

      <!-- 当前驾照信息 -->
      <div class="current-license-bar">
        <el-icon :size="16" color="#409eff"><InfoFilled /></el-icon>
        <span class="bar-label">当前驾照：</span>
        <el-tag size="small" effect="plain" :type="userStore.licenseType ? 'primary' : 'info'">
          {{ userStore.licenseType || '未报考' }}
        </el-tag>
        <span class="bar-divider"></span>
        <span class="bar-label">考试模式：</span>
        <el-tag size="small" :type="userStore.isSpecial ? 'warning' : 'primary'" effect="plain">
          {{ userStore.isSpecial ? '特种车' : '普通车' }}
        </el-tag>
      </div>

      <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="120px">
        <el-form-item label="增驾类型" prop="upgradeType">
          <el-radio-group v-model="applyForm.upgradeType">
            <el-radio :value="1">同级增驾 <span style="color: #909399; font-size: 12px">（同级别内切换车型）</span></el-radio>
            <el-radio :value="2">升级增驾 <span style="color: #909399; font-size: 12px">（跨级别升级，需上传驾驶证材料）</span></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标准驾车型" prop="targetLicense">
          <el-select v-model="applyForm.targetLicense" placeholder="请选择目标车型" style="width: 200px">
            <el-option-group v-for="group in filteredGroups" :key="group.label" :label="group.label">
              <el-option
                v-for="lt in group.options"
                :key="lt.value"
                :label="lt.label"
                :value="lt.value"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <!-- 驾驶证材料上传（升级增驾时） -->
        <el-form-item label="驾驶证材料" v-if="applyForm.upgradeType === 2" required>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
              <el-upload
                action=""
                :show-file-list="false"
                :before-upload="handleUploadLicFile"
                accept=".jpg,.jpeg,.png,.pdf"
              >
                <el-button type="primary" plain>本地上传</el-button>
              </el-upload>
              <el-button type="primary" plain @click="openMyFilesPicker">从我的文件选择</el-button>
            </div>
            <div v-if="selectedFiles.length > 0" style="display: flex; flex-wrap: wrap; gap: 4px">
              <el-tag
                v-for="(f, i) in selectedFiles"
                :key="f.id"
                type="success"
                closable
                @close="removeLicFile(i)"
              >
                {{ f.name }}
                <el-button link type="primary" size="small" @click.stop="previewFile(f.id)" style="margin-left: 2px">
                  预览
                </el-button>
              </el-tag>
            </div>
          </div>
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            支持 JPG/PNG/PDF 格式，可上传多个文件；升级增驾必须上传驾驶证材料
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleApply(false)" :loading="applyLoading">提交申请</el-button>
          <el-button v-if="applyForm.upgradeType === 2" type="warning" @click="handleApply(true)" :loading="demoLoading">演示申请(跳过驾龄)</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的文件选择对话框（多选） -->
    <el-dialog v-model="filePickerVisible" title="从我的文件选择驾驶证材料" width="650px" destroy-on-close>
      <div v-if="myFiles.length === 0" style="text-align: center; padding: 32px">
        <el-empty description="暂无已上传文件，请使用本地上传" />
      </div>
      <template v-else>
        <el-table ref="fileTableRef" :data="myFiles" border stripe @selection-change="onFileSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">
              {{ row.originalName || row.fileName || '未知文件' }}
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="previewFile(row.id)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 10px; text-align: right; color: #909399; font-size: 13px">
          已选 {{ pickedFiles.length }} 个文件
        </div>
      </template>
      <template #footer>
        <el-button @click="filePickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="pickedFiles.length === 0" @click="confirmPickFiles">确定选择</el-button>
      </template>
    </el-dialog>

    <!-- 我的增驾申请记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>我的增驾申请</span>
          <div style="display: flex; gap: 8px; align-items: center">
            <el-select v-model="filterStatus" placeholder="审核状态" clearable size="small" style="width: 120px" @change="fetchList">
              <el-option label="待审核" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="不通过" :value="2" />
            </el-select>
            <el-select v-model="filterTargetLicense" placeholder="目标车型" clearable size="small" style="width: 120px" @change="fetchList">
              <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
            </el-select>
            <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" :index="calcIndex" />
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

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: center"
        @current-change="fetchList"
        @size-change="onPageSizeChange"
      />

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
import { Refresh, InfoFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useFilePreview } from '@/composables/useFilePreview'
import { uploadFile, getMyFiles } from '@/api/file'
import { applyLicenseUpgrade, getMyLicenseUpgrades } from '@/api/licenseUpgrade'
import { getMyPaymentRecords, payMyPaymentRecord } from '@/api/payment'
import { LICENSE_TYPES, getUpgradableTypes } from '@/config/license'

const router = useRouter()
const userStore = useUserStore()

const recordList = ref([])
const paymentMap = ref({})
const loading = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 筛选
const filterStatus = ref(null)
const filterTargetLicense = ref(null)

function calcIndex(idx) {
  return (currentPage.value - 1) * pageSize.value + idx + 1
}

function onPageSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  fetchList()
}

// 申请表单
const applyFormRef = ref()
const applyForm = reactive({ targetLicense: '', upgradeType: 1, licenseFileId: null })
const applyLoading = ref(false)
const demoLoading = ref(false)

// 已选文件列表（多文件）
const selectedFiles = ref([])

// 文件选择器
const filePickerVisible = ref(false)
const myFiles = ref([])
const pickedFiles = ref([])
const fileTableRef = ref(null)

const applyRules = {
  targetLicense: [{ required: true, message: '请选择目标准驾车型', trigger: 'change' }],
  upgradeType: [{ required: true, message: '请选择增驾类型', trigger: 'change' }],
}

// 车型分组（按类别）
const licenseGroups = [
  { label: '小型汽车', values: ['C1', 'C2', 'C5', 'C6'] },
  { label: '中型/大型货车', values: ['B1', 'B2'] },
  { label: '大型客车/城市公交', values: ['A1', 'A3'] },
  { label: '摩托车', values: ['D', 'E', 'F'] },
  { label: '特种车辆', values: ['M', 'N', 'P'] },
]

// 当前驾照可增驾的车型（按分组过滤）
const filteredGroups = computed(() => {
  const upgradable = getUpgradableTypes(userStore.licenseType)
  const upgradableValues = new Set(upgradable.map(u => u.value))
  return licenseGroups
    .map(group => ({
      label: group.label,
      options: group.values
        .map(v => LICENSE_TYPES.find(lt => lt.value === v))
        .filter(Boolean)
        .filter(lt => upgradableValues.has(lt.value)),
    }))
    .filter(g => g.options.length > 0)
})

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
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }
    if (filterStatus.value !== null && filterStatus.value !== '') params.status = filterStatus.value
    if (filterTargetLicense.value) params.targetLicense = filterTargetLicense.value

    const res = await getMyLicenseUpgrades(params)
    const pageData = res || {}

    const list = Array.isArray(pageData.records) ? pageData.records : []
    total.value = pageData.total || 0

    // 获取支付记录
    const payments = await getMyPaymentRecords().catch(() => [])
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
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 本地上传（立即上传到文件管理）
async function handleUploadLicFile(file) {
  // 检查文件数量上限
  if (selectedFiles.value.length >= 5) {
    ElMessage.warning('最多上传 5 份文件')
    return false
  }
  // 检查文件名重复
  if (selectedFiles.value.some(f => f.name === file.name)) {
    ElMessage.warning('文件 "' + file.name + '" 已存在，请勿重复上传')
    return false
  }
  try {
    const res = await uploadFile(userStore.userId, file, 'existing_license', 'license_upgrade')
    const fileId = res.id || res.fileId
    selectedFiles.value.push({ id: fileId, name: file.name })
    ElMessage.success('驾驶证材料上传成功')
  } catch (e) {
    console.error('上传失败:', e)
    ElMessage.error('驾驶证材料上传失败')
  }
  return false
}

// 打开我的文件选择器
async function openMyFilesPicker() {
  try {
    const res = await getMyFiles()
    myFiles.value = Array.isArray(res) ? res : res.records || []
    pickedFiles.value = []
    if (fileTableRef.value) {
      fileTableRef.value.clearSelection()
    }
    filePickerVisible.value = true
  } catch (e) {
    console.error('获取我的文件失败:', e)
  }
}

// 文件选择变化
function onFileSelectionChange(selection) {
  pickedFiles.value = selection
}

// 确认选择文件
function confirmPickFiles() {
  pickedFiles.value.forEach(f => {
    const fileId = f.id || f.fileId
    if (!selectedFiles.value.some(sf => sf.id === fileId)) {
      selectedFiles.value.push({ id: fileId, name: f.originalName || f.fileName || '文件' })
    }
  })
  filePickerVisible.value = false
  ElMessage.success('已选择 ' + pickedFiles.value.length + ' 个文件')
}

// 移除单个文件
function removeLicFile(index) {
  selectedFiles.value.splice(index, 1)
}

// 预览文件
function previewFile(fileId) {
  const { previewFile: doPreview } = useFilePreview()
  doPreview(fileId)
}

async function handleApply(skipAgeCheck = false) {
  const valid = await applyFormRef.value.validate().catch(() => false)
  if (!valid) return

  // 升级增驾必传驾驶证材料
  if (applyForm.upgradeType === 2 && selectedFiles.value.length === 0) {
    ElMessage.warning('升级增驾请上传驾驶证材料')
    return
  }

  const loading = skipAgeCheck ? demoLoading : applyLoading
  loading.value = true
  try {
    const data = {
      targetLicense: applyForm.targetLicense,
      upgradeType: applyForm.upgradeType,
    }
    if (selectedFiles.value.length > 0) {
      data.licenseFileId = selectedFiles.value.map(f => f.id).join(',')
    }
    if (skipAgeCheck) data.skipAgeCheck = true

    await applyLicenseUpgrade(data)
    ElMessage.success(skipAgeCheck ? '演示申请已提交（已跳过驾龄校验）' : '增驾申请已提交')
    applyForm.targetLicense = ''
    applyForm.upgradeType = 1
    selectedFiles.value = []
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

/* 当前驾照信息条 */
.current-license-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  margin: 0 0 16px;
  background: #f0f5ff;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.bar-label {
  color: #909399;
  white-space: nowrap;
}

.bar-divider {
  width: 1px;
  height: 14px;
  background: #d9e1ec;
  margin: 0 4px;
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
