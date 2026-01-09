<script setup>
const quickStats = [
  { label: '客户总数', value: '1,280' },
  { label: '今日新增', value: '34' },
  { label: '邮件发送', value: '542' },
  { label: '活跃用户', value: '73%' },
]
</script>

<template>
  <div class="page">
    <h2>首页</h2>
    <p class="sub">这里是系统概览，可以快速查看关键数据。</p>
    <div class="stats">
      <div v-for="stat in quickStats" :key="stat.label" class="stat card">
        <div class="stat__label">{{ stat.label }}</div>
        <div class="stat__value">{{ stat.value }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub {
  color: #6b7280;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stat {
  padding: 16px;
}

.stat__label {
  color: #6b7280;
  font-size: 13px;
}

.stat__value {
  font-size: 26px;
  font-weight: 800;
  margin-top: 6px;
  color: #1d4ed8;
}
</style>
