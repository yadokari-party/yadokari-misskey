<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@close="windowEl?.close()"
	@closed="emit('closed')"
>
	<template v-if="emojiApplication" #header>:{{ emojiApplication.name }}:</template>
	<template v-else #header>{{ i18n.ts._emojiApplication.title }}</template>
	<MkEmojiApplicationEditor
		:emojiApplicationId="emojiApplicationId"
		:emojiApplication="emojiApplication"
		@done="done"
	/>
</MkWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkEmojiApplicationEditor from './MkEmojiApplicationEditor.vue';
import MkWindow from '@/components/MkWindow.vue';
import { i18n } from '@/i18n.js';

defineProps<{
	emojiApplicationId?: string,
	emojiApplication?: Misskey.entities.EmojiApplication,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { updated?: Misskey.entities.EmojiApplicationsUpdateRequest; created?: Misskey.entities.EmojiApplicationsUpdateRequest }): void,
	(ev: 'closed'): void
}>();

const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);

async function done(payload: { updated?: Misskey.entities.EmojiApplicationsUpdateRequest; created?: Misskey.entities.EmojiApplicationsUpdateRequest }) {
	if (payload.updated) {
		emit('done', { updated: payload.updated });
	} else if (payload.created) {
		emit('done', { created: payload.created });
	}
}
</script>
<style lang="scss" module>
</style>
