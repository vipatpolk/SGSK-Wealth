<script setup lang="ts">
const { t } = useI18n();
const { handleAuthCallback } = useAuth();
onMounted(async () => {
  await handleAuthCallback();
  await navigateTo('/');
});
</script>

<template>
  <LoadingScreen variant="inline" :title="t('auth.completingSignIn')" />
</template>
