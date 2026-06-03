<template>
  <div class="statistics">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.label" style="margin-bottom: 16px">
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

    <el-card>
      <template #header>
        <span>说明</span>
      </template>
      <p class="text-gray">统计报表功能正在开发中，以上数据为示例占位数据。后续将接入后端真实数据接口。</p>
    </el-card>
  </div>
</template>

<script setup>
import { User, School, Calendar, DataAnalysis } from '@element-plus/icons-vue'

const stats = [
  { label: '用户总数', value: '—', icon: User, bgColor: '#409eff' },
  { label: '教练总数', value: '—', icon: School, bgColor: '#67c23a' },
  { label: '今日约课', value: '—', icon: Calendar, bgColor: '#e6a23c' },
  { label: '考试场次', value: '—', icon: DataAnalysis, bgColor: '#f56c6c' },
]
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
    font-size: 28px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 14px;
    color: #999;
    margin: 4px 0 0;
  }
}
.text-gray { color: #909399; }
</style>
