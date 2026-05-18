<template>
  <div class="home">
    <el-card shadow="never" class="welcome-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="24" color="#409eff"><HomeFilled /></el-icon>
          <span>欢迎使用 DriveMan</span>
        </div>
      </template>
      <p>基于 Vue 3 + Element Plus 的前端基础框架已搭建成功。</p>
      <el-divider />
      <el-row :gutter="20">
        <el-col :span="8" v-for="item in features" :key="item.title">
          <el-card shadow="hover" class="feature-card">
            <el-icon :size="28" :color="item.color"><component :is="item.icon" /></el-icon>
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { HomeFilled, Link, Setting } from '@element-plus/icons-vue'

const features = [
  { title: 'Vue 3', desc: '组合式 API + Vite 构建', icon: HomeFilled, color: '#409eff' },
  { title: 'Element Plus', desc: 'UI 组件库 + 中文国际化', icon: Link, color: '#67c23a' },
  { title: 'Pinia', desc: '轻量级状态管理', icon: Setting, color: '#e6a23c' },
]
</script>

<style lang="scss" scoped>
.home {
  max-width: 960px;
  margin: 40px auto;
}

.welcome-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
  }
}

.feature-card {
  text-align: center;
  h4 {
    margin: 12px 0 6px;
  }
  p {
    font-size: 13px;
    color: #666;
  }
}
</style>
