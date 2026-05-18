<template>
  <div class="hello-world">
    <h2>{{ msg }}</h2>
  </div>
</template>

<script setup>
defineProps({
  msg: { type: String, default: 'Hello World' },
})
</script>

<style lang="scss" scoped>
.hello-world {
  text-align: center;
  h2 {
    color: $primary-color;
  }
}
</style>
