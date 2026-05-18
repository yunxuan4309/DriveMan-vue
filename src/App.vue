<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo">DriveMan</div>
      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        class="nav-menu"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/about">关于</el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style lang="scss">
@use '@/styles/global' as *;

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 24px;

  .logo {
    font-size: 22px;
    font-weight: 700;
    color: $primary-color;
    margin-right: 40px;
    white-space: nowrap;
  }

  .nav-menu {
    flex: 1;
    border-bottom: none;
  }
}

.app-main {
  background: #f5f7fa;
  min-height: calc(100vh - $header-height);
}
</style>
