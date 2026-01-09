<script setup>
import { ref } from 'vue'

const form = ref({
  to: '',
  subject: '',
  content: '',
})

const message = ref('')

const send = () => {
  if (!form.value.to || !form.value.subject || !form.value.content) {
    message.value = '请填写完整邮件信息'
    return
  }
  message.value = '已模拟发送，实际对接请替换为真实接口'
}
</script>

<template>
  <div class="page">
    <h2>发送邮件</h2>
    <p class="sub">向客户发送邮件，可在此处集成真实服务端接口</p>

    <div class="form card">
      <label class="field">
        <span>收件人</span>
        <input v-model="form.to" type="email" placeholder="customer@example.com" />
      </label>
      <label class="field">
        <span>主题</span>
        <input v-model="form.subject" type="text" placeholder="请输入邮件主题" />
      </label>
      <label class="field">
        <span>正文</span>
        <textarea v-model="form.content" rows="6" placeholder="请输入邮件内容"></textarea>
      </label>
      <div class="actions">
        <button class="btn" type="button" @click="send">发送</button>
        <span v-if="message" class="tip">{{ message }}</span>
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

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #111827;
  font-weight: 600;
}

input,
textarea {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #fff;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tip {
  color: #2563eb;
  font-size: 13px;
}
</style>
