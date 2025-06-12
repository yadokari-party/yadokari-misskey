<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkAvatarDecorationApplicationEditor
		:avatarDecorationApplicationId="avatarDecorationApplicationId"
		:avatarDecorationApplication="avatarDecorationApplication"
	/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { definePage } from '@/page.js';
import MkAvatarDecorationApplicationEditor from '@/components/avatar-decoration-application/MkAvatarDecorationApplicationEditor.vue';
import { i18n } from '@/i18n.js';

defineProps<{
	avatarDecorationApplicationId?: string,
	avatarDecorationApplication?: Misskey.entities.AvatarDecorationApplication,
}>();

definePage(() => ({
	title: i18n.ts._avatarDecorationApplication.title,
	icon: 'ti ti-triangle-plus-2',
}));
</script>

<style lang="scss" module>
</style>
