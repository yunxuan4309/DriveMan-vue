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
    <el-card v-if="!paymentInfo && !isPaid">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getPackages, applyEnrollment, payEnrollment } from '@/api/enrollment'

const userStore = useUserStore()

const loading = ref(false)
const applyLoading = ref(false)
const payLoading = ref(false)
const isPaid = ref(false)
const paymentInfo = ref(null)
const selectedPackage = ref(null)
const packageGroups = ref([])

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
    ElMessage.success('支付成功，您已成为正式学员！请从首页进入各项功能。')
  } catch (error) {
    if (error !== 'cancel') console.error('支付失败:', error)
  } finally {
    payLoading.value = false
  }
}

onMounted(() => {
  if (userStore.role !== 0) {
    isPaid.value = true
    return
  }
  fetchPackages()
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
