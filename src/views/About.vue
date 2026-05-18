<template>
  <div class="about">
    <el-card>
      <template #header>
        <span>关于</span>
      </template>
      <p>DriveMan 是一个基于 Vue 3 + Element Plus 构建的项目。</p>
      <p>当前计数：{{ counterStore.count }}（双倍：{{ counterStore.doubleCount }}）</p>
      <el-button type="primary" @click="counterStore.increment">+1</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
</script>

<style lang="scss" scoped>
.about {
  max-width: 600px;
  margin: 40px auto;
  p {
    margin-bottom: 12px;
  }
}
</style>
