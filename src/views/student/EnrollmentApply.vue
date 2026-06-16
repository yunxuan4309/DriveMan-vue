<template>
  <div class="enrollment-apply">
    <!-- 状态提示 -->
    <el-alert
      v-if="isPaid"
      title="您已成为正式学员！"
      type="success"
      :closable="false"
      show-icon
      class="status-alert"
    >
      <p style="margin: 8px 0 0">您已成功报名，可以使用全部学员功能。请从首页进入各功能模块。</p>
      <el-button type="primary" style="margin-top: 12px" @click="$router.push('/')">返回首页</el-button>
    </el-alert>

    <!-- C5 待审核提示 -->
    <el-alert
      v-else-if="pendingAudit"
      title="报名已提交，等待管理员审核"
      type="warning"
      :closable="false"
      show-icon
      class="status-alert"
    >
      <p style="margin: 4px 0">
        报考车型：<el-tag size="small" type="warning">{{ pendingAudit.licenseType }}</el-tag>
      </p>
      <p v-if="disabilityStatus === null" style="margin: 4px 0; color: #e6a23c; font-weight: 600">
        您还未提交残疾信息，请先上传残疾人证扫描件并提交审核
      </p>
      <p v-else-if="disabilityStatus === 0" style="margin: 4px 0; color: #909399">
        残疾信息已提交，请等待管理员审核残疾信息
      </p>
      <p v-else-if="disabilityStatus === 2" style="margin: 4px 0; color: #f56c6c">
        残疾信息审核未通过，请重新提交
      </p>
      <p v-else-if="disabilityStatus === 1" style="margin: 4px 0; color: #67c23a">
        残疾信息已审核通过，等待管理员审核报名
      </p>
      <p style="margin: 4px 0; color: #909399; font-size: 13px">
        审核通过后，您将收到待支付账单，届时请完成缴费
      </p>
      <el-button
        v-if="disabilityStatus !== 1"
        type="primary"
        size="small"
        style="margin-top: 8px"
        @click="$router.push('/student/disability-info')"
      >
        {{ disabilityStatus === null ? '去提交残疾信息' : '查看/修改残疾信息' }}
      </el-button>
      <el-button
        v-else
        type="success"
        size="small"
        style="margin-top: 8px"
        @click="$router.push('/student/disability-info')"
      >
        查看残疾信息
      </el-button>
    </el-alert>

    <!-- 待支付提示 -->
    <el-alert
      v-else-if="paymentInfo"
      title="报名申请已提交"
      type="info"
      :closable="false"
      show-icon
      class="status-alert"
    >
      <p style="margin: 4px 0">
        报考车型：<el-tag size="small" type="warning">{{ paymentInfo.licenseType }}</el-tag>
        &nbsp; 金额：<strong style="color: #f56c6c">¥{{ paymentInfo.amount }}</strong>
      </p>
      <el-button type="success" style="margin-top: 8px" :loading="payLoading" @click="handlePay">立即支付（模拟）</el-button>
    </el-alert>

    <!-- 套餐选择 -->
    <el-card v-if="!paymentInfo && !isPaid && !pendingAudit">
      <template #header>
        <span style="font-weight: 600; font-size: 16px">选择驾考报名套餐</span>
      </template>

      <div v-loading="loading">
        <el-empty v-if="!loading && packageGroups.length === 0" description="暂无可选套餐" />

        <div v-for="group in packageGroups" :key="group.licenseType" style="margin-bottom: 24px">
          <h3 style="margin: 0 0 12px; color: #303133">
            <el-tag type="warning" size="large">{{ group.licenseType }}</el-tag>
            <span style="margin-left: 8px; font-size: 16px">{{ group.licenseType }} 车型套餐</span>
          </h3>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" v-for="pkg in group.packages" :key="pkg.id">
              <el-card
                shadow="hover"
                class="package-card"
                :class="{ 'is-selected': selectedPackage?.id === pkg.id }"
                @click="selectPackage(group.licenseType, pkg)"
              >
                <div class="package-info">
                  <h4>{{ pkg.description || group.licenseType + ' 全包套餐' }}</h4>
                  <p class="package-price">
                    <span class="price-symbol">¥</span>
                    <span class="price-value">{{ pkg.amount }}</span>
                  </p>
                  <p class="package-desc">全包套餐，包含全部科目费用</p>
                  <el-tag v-if="selectedPackage?.id === pkg.id" type="success" size="small" effect="dark">
                    已选择
                  </el-tag>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div style="text-align: center; margin-top: 24px" v-if="packageGroups.length > 0">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedPackage"
            :loading="applyLoading"
            @click="handleApply"
          >
            {{ selectedPackage ? `确认报名 — ¥${selectedPackage.amount}` : '请先选择套餐' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getPackages, applyEnrollment, payEnrollment } from '@/api/enrollment'
import { getCurrentUser } from '@/api/user'
import { getMyPaymentRecords } from '@/api/payment'
import { getMyDisabilityInfo } from '@/api/disabilityInfo'

const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const applyLoading = ref(false)
const payLoading = ref(false)
const isPaid = ref(false)
const pendingAudit = ref(null)
const paymentInfo = ref(null)
const selectedPackage = ref(null)
const packageGroups = ref([])
const disabilityStatus = ref(null) // null=未提交, 0=待审核, 1=已通过, 2=已拒绝

async function checkDisabilityStatus() {
  try {
    const info = await getMyDisabilityInfo()
    disabilityStatus.value = info.auditStatus
  } catch {
    disabilityStatus.value = null
  }
}

async function fetchPackages() {
  loading.value = true
  try {
    const res = await getPackages()
    const byType = res.byType || {}
    packageGroups.value = Object.entries(byType).map(([licenseType, packages]) => ({
      licenseType,
      packages: Array.isArray(packages) ? packages : [],
    }))
  } catch {
    packageGroups.value = []
  } finally {
    loading.value = false
  }
}

function selectPackage(licenseType, pkg) {
  selectedPackage.value = { ...pkg, licenseType }
}

async function handleApply() {
  if (!selectedPackage.value) return

  try {
    await ElMessageBox.confirm(
      `确认选择「${selectedPackage.value.licenseType}」车型的「${selectedPackage.value.description}」套餐？费用 ¥${selectedPackage.value.amount}`,
      '确认报名',
      { type: 'info' }
    )
    applyLoading.value = true

    const res = await applyEnrollment(
      userStore.userId,
      selectedPackage.value.licenseType,
      selectedPackage.value.id
    )
    // C5 等需审核的车型 → 进入待审核状态
    if (res.needAudit) {
      pendingAudit.value = { licenseType: res.licenseType, message: res.message }
      localStorage.setItem('pendingAuditLicense', res.licenseType)
      checkDisabilityStatus()
      ElMessage.success(res.message || '报名已提交，等待管理员审核')
      return
    }
    // 普通车型 → 直接进入支付
    paymentInfo.value = {
      paymentId: res.paymentId,
      amount: res.amount,
      licenseType: res.licenseType,
      description: res.description,
    }
    ElMessage.success('报名申请已提交，请完成支付')
  } catch (error) {
    if (error !== 'cancel') console.error('报名失败:', error)
  } finally {
    applyLoading.value = false
  }
}

async function handlePay() {
  if (!paymentInfo.value) return

  try {
    await ElMessageBox.confirm(
      `确认支付 ¥${paymentInfo.value.amount} 完成报名？`,
      '确认支付',
      { type: 'info' }
    )
    payLoading.value = true

    const res = await payEnrollment(paymentInfo.value.paymentId)

    // 替换新 JWT（后端签发了含 role=1 的新 token）
    if (res?.token) {
      localStorage.setItem('token', res.token)
      userStore.token = res.token
    }
    // 更新本地 role 缓存
    localStorage.setItem('role', '1')
    userStore.role = 1

    isPaid.value = true
    paymentInfo.value = null
    ElMessage.success('支付成功，您已成为正式学员！正在跳转...')
    // 延迟跳转，让用户看到成功提示，同时侧边栏已自动刷新为学员菜单
    setTimeout(() => router.push('/'), 1500)
  } catch (error) {
    if (error !== 'cancel') console.error('支付失败:', error)
  } finally {
    payLoading.value = false
  }
}

onMounted(async () => {
  try {
    // 从后端获取真实的用户状态（JWT 中的角色可能已过时）
    const user = await getCurrentUser()

    if (user.role >= 1) {
      // 检查是否有未支付的报名账单（C5 审核通过后会有 unpaid 账单）
      try {
        const records = await getMyPaymentRecords()
        const unpaid = Array.isArray(records)
          ? records.find(r => r.bizType === 'enrollment_fee' && r.status === 0)
          : null
        if (unpaid) {
          localStorage.removeItem('pendingAuditLicense')
          paymentInfo.value = {
            paymentId: unpaid.id,
            amount: unpaid.amount,
            licenseType: user.licenseType || unpaid.licenseType,
            description: unpaid.description,
          }
          return
        }
      } catch { /* 查询失败则默认已支付 */ }

      isPaid.value = true
      return
    }

    // role === 0
    localStorage.removeItem('pendingAuditLicense')
    if (user.licenseType && ['C5'].includes(user.licenseType)) {
      pendingAudit.value = { licenseType: user.licenseType, message: '您的报名正在审核中' }
      checkDisabilityStatus()
      return
    }

    fetchPackages()
  } catch {
    // 后端查询失败时降级到本地缓存逻辑
    if (userStore.role !== 0) {
      isPaid.value = true
      return
    }
    const pendingLicense = localStorage.getItem('pendingAuditLicense')
    if (pendingLicense) {
      pendingAudit.value = { licenseType: pendingLicense, message: '您的报名正在审核中' }
      return
    }
    fetchPackages()
  }
})
</script>

<style scoped lang="scss">
.enrollment-apply {
  max-width: 800px;
  margin: 32px auto;
}

.status-alert {
  margin-bottom: 20px;
}

.package-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  :deep(.el-card__body) {
    padding: 20px;
  }

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: #67c23a;
    background-color: #f0f9eb;
  }
}

.package-info {
  text-align: center;

  h4 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  .package-price {
    margin: 8px 0;
    color: #f56c6c;

    .price-symbol {
      font-size: 18px;
      font-weight: 600;
    }

    .price-value {
      font-size: 28px;
      font-weight: 700;
    }
  }

  .package-desc {
    margin: 6px 0;
    font-size: 13px;
    color: #999;
  }
}
</style>
