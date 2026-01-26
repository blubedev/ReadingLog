<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // トークンがある場合、ユーザー情報を取得
  if (authStore.token) {
    try {
      await authStore.fetchMe()
    } catch (error) {
      // トークンが無効な場合、認証情報をクリア
      console.error('Failed to fetch user info:', error)
      authStore.clearAuth()
      // 認証が必要なページにいる場合はログインページへ
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push({ name: 'Login' })
      }
    }
  }
})
</script>
