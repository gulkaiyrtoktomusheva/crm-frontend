<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { Mail, Lock } from 'lucide-vue-next'

const { t } = useI18n()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref({})

async function handleLogin() {
  errors.value = {}

  if (!email.value) {
    errors.value.email = t('login.emailRequired')
  }
  if (!password.value) {
    errors.value.password = t('login.passwordRequired')
  }

  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    await authStore.login({
      email: email.value,
      password: password.value
    })
    toast.success(t('login.welcomeBack'))
  } catch (e) {
    toast.error(e.response?.data?.message || t('login.invalidCredentials'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e]">
    <!-- Background effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl" />
      <div class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl" />
    </div>

    <!-- Login card -->
    <div class="w-full max-w-md relative animate-scale-in">
      <div class="glass-strong rounded-3xl p-8">
        <!-- Logo -->
        <div class="flex items-center justify-center gap-3 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <span class="text-white font-bold text-xl">O</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">ORT CRM</h1>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('login.courseManagement') }}</p>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <BaseInput
            v-model="email"
            :label="t('login.email')"
            type="email"
            placeholder="admin@ortcrm.kg"
            :icon="Mail"
            :error="errors.email"
          />

          <BaseInput
            v-model="password"
            :label="t('login.password')"
            type="password"
            :placeholder="t('login.enterPassword')"
            :icon="Lock"
            :error="errors.password"
          />

          <BaseButton
            type="submit"
            :loading="loading"
            class="w-full mt-6"
          >
            {{ t('login.signIn') }}
          </BaseButton>
        </form>

        <!-- Demo credentials hint -->
        <div class="mt-6 p-4 bg-white/5 rounded-xl">
          <p class="text-xs text-[var(--text-secondary)] text-center">
            Demo: admin@ortcrm.kg / admin123
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
