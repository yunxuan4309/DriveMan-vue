<template>
  <div class="statistics">
    <!-- 收支汇总 -->
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in summaryStats" :key="stat.label">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon" :style="{ background: stat.bgColor }">
              <el-icon :size="24" color="#fff"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ stat.value }}</p>
              <p class="stat-label">{{ stat.label }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <!-- 报名趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header-wrap">
              <span>报名趋势</span>
              <div class="header-actions">
                <el-date-picker
                  v-model="trendDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 240px"
                  @change="handleTrendDateChange"
                />
                <el-button text type="primary" @click="handleExport('trend')" :icon="Download" :loading="exporting.trend">导出</el-button>
                <el-button text type="primary" @click="fetchRegistrationTrend" :icon="Refresh" :loading="loading.trend">刷新</el-button>
              </div>
            </div>
          </template>
          <div ref="registrationTrendRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 各科目通过率趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header-wrap">
              <span>各科目月度通过率趋势</span>
              <div class="header-actions">
                <el-select v-model="passRateFilters.year" placeholder="全部年份" clearable style="width: 110px" @change="fetchPassRate">
                  <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                </el-select>
                <el-select v-model="passRateFilters.subject" placeholder="全部科目" clearable style="width: 110px" @change="fetchPassRate">
                  <el-option label="科目一" :value="1" />
                  <el-option label="科目二" :value="2" />
                  <el-option label="科目三" :value="3" />
                  <el-option label="科目四" :value="4" />
                </el-select>
                <el-button text type="primary" @click="handleExport('passRate')" :icon="Download" :loading="exporting.passRate">导出</el-button>
                <el-button text type="primary" @click="fetchPassRate" :icon="Refresh" :loading="loading.passRate">刷新</el-button>
              </div>
            </div>
          </template>
          <div ref="passRateRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- 教练效能排名 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header-wrap">
              <span>教练效能排名</span>
              <div class="header-actions">
                <el-select v-model="coachFilters.licenseType" placeholder="全部车型" clearable style="width: 110px" @change="fetchCoachWorkload">
                  <el-option v-for="t in licenseTypes" :key="t" :label="t" :value="t" />
                </el-select>
                <el-input-number v-model="coachFilters.topN" :min="1" :max="100" placeholder="Top" style="width: 100px" controls-position="right" @change="fetchCoachWorkload" />
                <el-button text type="primary" @click="handleExport('coach')" :icon="Download" :loading="exporting.coach">导出</el-button>
                <el-button text type="primary" @click="fetchCoachWorkload" :icon="Refresh" :loading="loading.coach">刷新</el-button>
              </div>
            </div>
          </template>
          <div ref="coachWorkloadRef" class="chart-container"></div>
          <!-- 教练明细表格 -->
          <el-table :data="coachDetailData" border stripe size="small" style="margin-top: 16px" v-if="coachDetailData.length">
            <el-table-column prop="coachName" label="教练姓名" width="100" align="center" />
            <el-table-column prop="rating" label="评分" width="70" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled show-score size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="studentCount" label="学员数" width="70" align="center" />
            <el-table-column prop="examCount" label="考试次数" width="80" align="center" />
            <el-table-column prop="passCount" label="通过次数" width="80" align="center" />
            <el-table-column prop="passRate" label="通过率" width="80" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.passRate >= 80 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                  {{ row.passRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="coachYears" label="执教年限" width="80" align="center" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 收入看板 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header-wrap">
              <span>收入看板</span>
              <div class="header-actions">
                <el-select v-model="revenueFilters.year" placeholder="全部年份" clearable style="width: 110px" @change="fetchRevenueSummary">
                  <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                </el-select>
                <el-button text type="primary" @click="handleExport('revenue')" :icon="Download" :loading="exporting.revenue">导出</el-button>
                <el-button text type="primary" @click="fetchRevenueSummary" :icon="Refresh" :loading="loading.revenue">刷新</el-button>
              </div>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart-container"></div>
          <div ref="bizTypeChartRef" class="chart-container-small"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Money, Check, Clock, Close, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getRegistrationTrend,
  getPassRate,
  getCoachWorkload,
  getRevenueSummary,
  exportRegistrationTrend,
  exportPassRate,
  exportCoachWorkload,
  exportRevenueSummary,
} from '@/api/statistics'

const licenseTypes = ['C1', 'C2', 'C5', 'C6', 'B1', 'B2', 'A1', 'A2', 'A3', 'D', 'E', 'F', 'M', 'N', 'P']

// 图表 refs
const registrationTrendRef = ref(null)
const passRateRef = ref(null)
const coachWorkloadRef = ref(null)
const revenueChartRef = ref(null)
const bizTypeChartRef = ref(null)

// 图表实例
let registrationTrendChart = null
let passRateChart = null
let coachWorkloadChart = null
let revenueChart = null
let bizTypeChart = null

// 加载状态
const loading = reactive({
  trend: false,
  passRate: false,
  coach: false,
  revenue: false,
})
const exporting = reactive({
  trend: false,
  passRate: false,
  coach: false,
  revenue: false,
})

// 年份选项
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= 2023; y--) {
    years.push(y)
  }
  return years
})

// 报名趋势日期范围
const trendDateRange = ref(null)

// 通过率筛选
const passRateFilters = reactive({
  year: undefined,
  subject: undefined,
})

// 教练效能筛选
const coachFilters = reactive({
  licenseType: '',
  topN: undefined,
})

// 收入看板筛选
const revenueFilters = reactive({
  year: undefined,
})

// 汇总数据
const summaryStats = ref([
  { label: '已支付总额', value: '¥0', icon: Money, bgColor: '#67c23a' },
  { label: '已支付笔数', value: '0 笔', icon: Check, bgColor: '#409eff' },
  { label: '待支付总额', value: '¥0', icon: Clock, bgColor: '#e6a23c' },
  { label: '已退款总额', value: '¥0', icon: Close, bgColor: '#909399' },
])

// 教练明细数据
const coachDetailData = ref([])

// 初始化图表
function initCharts() {
  registrationTrendChart = echarts.init(registrationTrendRef.value)
  passRateChart = echarts.init(passRateRef.value)
  coachWorkloadChart = echarts.init(coachWorkloadRef.value)
  revenueChart = echarts.init(revenueChartRef.value)
  bizTypeChart = echarts.init(bizTypeChartRef.value)
}

// 设置空图表
function setEmptyChart(chart, title = '暂无数据') {
  chart.setOption({
    title: { text: title, left: 'center', top: 'center', textStyle: { color: '#909399', fontSize: 14 } },
    xAxis: { show: false },
    yAxis: { show: false },
    series: [],
  })
}

function getTrendParams() {
  const params = {}
  if (trendDateRange.value) {
    params.startDate = trendDateRange.value[0]
    params.endDate = trendDateRange.value[1]
  }
  return params
}

function handleTrendDateChange() {
  fetchRegistrationTrend()
}

async function fetchRegistrationTrend() {
  loading.trend = true
  try {
    const res = await getRegistrationTrend(getTrendParams())
    if (res && res.xAxis && res.series) {
      registrationTrendChart.setOption(res)
    } else {
      setEmptyChart(registrationTrendChart, '暂无报名趋势数据')
    }
  } catch (error) {
    console.error('获取报名趋势失败:', error)
    setEmptyChart(registrationTrendChart, '加载失败')
  } finally {
    loading.trend = false
  }
}

function getPassRateParams() {
  const params = {}
  if (passRateFilters.year) params.year = passRateFilters.year
  if (passRateFilters.subject) params.subject = passRateFilters.subject
  return params
}

async function fetchPassRate() {
  loading.passRate = true
  try {
    const res = await getPassRate(getPassRateParams())
    if (res && res.xAxis && res.series) {
      passRateChart.setOption(res)
    } else {
      setEmptyChart(passRateChart, '暂无通过率数据')
    }
  } catch (error) {
    console.error('获取通过率失败:', error)
    setEmptyChart(passRateChart, '加载失败')
  } finally {
    loading.passRate = false
  }
}

function getCoachParams() {
  const params = {}
  if (coachFilters.licenseType) params.licenseType = coachFilters.licenseType
  if (coachFilters.topN) params.topN = coachFilters.topN
  return params
}

async function fetchCoachWorkload() {
  loading.coach = true
  try {
    const res = await getCoachWorkload(getCoachParams())
    if (res && res.xAxis && res.series) {
      coachWorkloadChart.setOption(res)
      coachDetailData.value = res.detailData || []
    } else {
      setEmptyChart(coachWorkloadChart, '暂无教练数据')
      coachDetailData.value = []
    }
  } catch (error) {
    console.error('获取教练效能失败:', error)
    setEmptyChart(coachWorkloadChart, '加载失败')
    coachDetailData.value = []
  } finally {
    loading.coach = false
  }
}

function getRevenueParams() {
  const params = {}
  if (revenueFilters.year) params.year = revenueFilters.year
  return params
}

async function fetchRevenueSummary() {
  loading.revenue = true
  try {
    const res = await getRevenueSummary(getRevenueParams())
    if (res) {
      // 更新汇总数据
      if (res.summary) {
        summaryStats.value[0].value = `¥${res.summary.total_paid || 0}`
        summaryStats.value[1].value = `${res.summary.paid_count || 0} 笔`
        summaryStats.value[2].value = `¥${res.summary.total_pending || 0}`
        summaryStats.value[3].value = `¥${res.summary.total_refunded || 0}`
      }

      // 月度趋势图
      if (res.monthlyChart) {
        revenueChart.setOption(res.monthlyChart)
      } else {
        setEmptyChart(revenueChart, '暂无收入数据')
      }

      // 来源分布饼图
      if (res.bizTypeChart) {
        bizTypeChart.setOption(res.bizTypeChart)
      } else {
        setEmptyChart(bizTypeChart, '暂无分布数据')
      }
    }
  } catch (error) {
    console.error('获取收入看板失败:', error)
    setEmptyChart(revenueChart, '加载失败')
    setEmptyChart(bizTypeChart, '加载失败')
  } finally {
    loading.revenue = false
  }
}

// ── Excel 导出 ──────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const exportFns = {
  trend: { fn: exportRegistrationTrend, paramsFn: getTrendParams, name: '报名趋势.xlsx' },
  passRate: { fn: exportPassRate, paramsFn: getPassRateParams, name: '各科通过率.xlsx' },
  coach: { fn: exportCoachWorkload, paramsFn: getCoachParams, name: '教练效能排名.xlsx' },
  revenue: { fn: exportRevenueSummary, paramsFn: getRevenueParams, name: '收入看板.xlsx' },
}

async function handleExport(type) {
  const { fn, paramsFn, name } = exportFns[type]
  if (!fn) return
  exporting[type] = true
  try {
    const res = await fn(paramsFn())
    downloadBlob(res, name)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  } finally {
    exporting[type] = false
  }
}

// 窗口resize时重绘图表
function handleResize() {
  registrationTrendChart?.resize()
  passRateChart?.resize()
  coachWorkloadChart?.resize()
  revenueChart?.resize()
  bizTypeChart?.resize()
}

onMounted(() => {
  initCharts()

  // 加载所有数据
  fetchRegistrationTrend()
  fetchPassRate()
  fetchCoachWorkload()
  fetchRevenueSummary()

  // 监听窗口resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // 销毁图表实例
  registrationTrendChart?.dispose()
  passRateChart?.dispose()
  coachWorkloadChart?.dispose()
  revenueChart?.dispose()
  bizTypeChart?.dispose()
})
</script>

<style scoped lang="scss">
.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  .stat-label {
    font-size: 14px;
    color: #999;
    margin: 4px 0 0;
  }
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container-small {
  height: 200px;
  width: 100%;
  margin-top: 16px;
}

.card-header-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
