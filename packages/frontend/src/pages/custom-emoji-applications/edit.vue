<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkEmojiApplicationEditor
		:emojiApplicationId="emojiApplicationId"
		:emojiApplication="emojiApplication"
	/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkEmojiApplicationEditor from '@/components/emoji-application/MkEmojiApplicationEditor.vue';
import { i18n } from '@/i18n.js';

defineProps<{
	emojiApplicationId?: string,
	emojiApplication?: Misskey.entities.EmojiApplication,
}>();

definePageMetadata(() => ({
	title: i18n.ts._emojiApplication.title,
	icon: 'ti ti-triangle-plus-2',
}));
</script>

<style lang="scss" module>
</style>
