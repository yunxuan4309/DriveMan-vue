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
            <span>近30天报名趋势</span>
            <el-button text type="primary" @click="fetchRegistrationTrend" :icon="Refresh" :loading="loading.trend">刷新</el-button>
          </template>
          <div ref="registrationTrendRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 各科目通过率趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>各科目月度通过率趋势</span>
            <el-button text type="primary" @click="fetchPassRate" :icon="Refresh" :loading="loading.passRate">刷新</el-button>
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
            <span>教练效能排名</span>
            <el-button text type="primary" @click="fetchCoachWorkload" :icon="Refresh" :loading="loading.coach">刷新</el-button>
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
            <span>收入看板</span>
            <el-button text type="primary" @click="fetchRevenueSummary" :icon="Refresh" :loading="loading.revenue">刷新</el-button>
          </template>
          <div ref="revenueChartRef" class="chart-container"></div>
          <div ref="bizTypeChartRef" class="chart-container-small"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Refresh, Money, Check, Clock, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getRegistrationTrend,
  getPassRate,
  getCoachWorkload,
  getRevenueSummary,
} from '@/api/statistics'

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

async function fetchRegistrationTrend() {
  loading.trend = true
  try {
    const res = await getRegistrationTrend()
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

async function fetchPassRate() {
  loading.passRate = true
  try {
    const res = await getPassRate()
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

async function fetchCoachWorkload() {
  loading.coach = true
  try {
    const res = await getCoachWorkload()
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

async function fetchRevenueSummary() {
  loading.revenue = true
  try {
    const res = await getRevenueSummary()
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
</style>
