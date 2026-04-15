<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { rolesApi } from '@/api/roles'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const roles = ref([])

const roleOptions = computed(() => roles.value.map((role) => ({
  value: role.name,
  label: role.name
})))

const emptyForm = () => ({
  fullName: '',
  email: '',
  phone: '',
  roleName: '',
  password: ''
})

const form = ref(emptyForm())

onMounted(async () => {
  try {
    roles.value = await rolesApi.getAll()
  } catch (error) {
    roles.value = []
  }
})

watch(() => props.show, (open) => {
  if (!open) return

  if (props.user) {
    form.value = {
      fullName: props.user.fullName || '',
      email: props.user.email || '',
      phone: props.user.phone || '',
      roleName: props.user.roleName || '',
      password: ''
    }
    return
  }

  form.value = emptyForm()
})

function handleSubmit() {
  emit('submit', {
    fullName: form.value.fullName.trim(),
    email: form.value.email.trim(),
    phone: form.value.phone.trim() || null,
    roleName: form.value.roleName,
    password: form.value.password || undefined
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="user ? t('users.editUser') : t('users.newUser')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.fullName"
        :label="t('users.fullName') + ' *'"
        :placeholder="t('users.fullNamePlaceholder')"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.email"
          :label="t('users.email') + ' *'"
          type="email"
          placeholder="name@example.com"
        />
        <BaseInput
          v-model="form.phone"
          :label="t('users.phone')"
          placeholder="+996 XXX XXX XXX"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseSelect
          v-model="form.roleName"
          :label="t('users.role') + ' *'"
          :options="roleOptions"
          :placeholder="t('users.selectRole')"
        />
        <BaseInput
          v-model="form.password"
          :label="props.user ? t('users.newPassword') : t('users.password') + ' *'"
          type="password"
          :placeholder="props.user ? t('users.newPasswordPlaceholder') : '********'"
        />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.fullName.trim() || !form.email.trim() || !form.roleName || (!props.user && !form.password)"
        @click="handleSubmit"
      >
        {{ props.user ? t('common.save') : t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
