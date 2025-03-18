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
	<template v-if="avatarDecorationApplication" #header>{{ avatarDecorationApplication.name }}</template>
	<template v-else #header>New decoration</template>

	<MkAvatarDecorationApplicationEditor
		:avatarDecorationApplicationId="avatarDecorationApplicationId"
		:avatarDecorationApplication="avatarDecorationApplication"
		@done="done"
	/>
</MkWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type * as Misskey from 'misskey-js';
import MkAvatarDecorationApplicationEditor from '@/components/avatar-decoration-application/MkAvatarDecorationApplicationEditor.vue';
import MkWindow from '@/components/MkWindow.vue';

defineProps<{
	avatarDecorationApplicationId?: string,
	avatarDecorationApplication?: Misskey.entities.AvatarDecorationApplication,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: Misskey.entities.AvatarDecorationApplicationsUpdateRequest; created?: Misskey.entities.AvatarDecorationApplicationsUpdateRequest }): void,
	(ev: 'closed'): void
}>();

const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);

async function done(payload: { updated?: Misskey.entities.AvatarDecorationApplicationsUpdateRequest; created?: Misskey.entities.AvatarDecorationApplicationsUpdateRequest }) {
	if (payload.updated) {
		emit('done', { updated: payload.updated });
	} else if (payload.created) {
		emit('done', { created: payload.created });
	}
}
</script>
<style lang="scss" module></style>
