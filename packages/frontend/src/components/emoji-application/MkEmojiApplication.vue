<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :opened="true">
	<template #icon>
		<i v-if="emojiApplication.status === 'accepted'" class="ti ti-check" style="color: var(--MI_THEME-success)"></i>
		<i v-else-if="emojiApplication.status === 'rejected'" class="ti ti-x" style="color: var(--MI_THEME-error)"></i>
		<i v-else-if="emojiApplication.status === 'canceled'" class="ti ti-slash" style="color: var(--MI_THEME-error)"></i>
		<i v-else class="ti ti-exclamation-circle" style="color: var(--MI_THEME-warn)"></i>
	</template>
	<template #label>{{ emojiApplication.name }}</template>
	<template #caption>{{ emojiApplication.category }}</template>
	<template v-if="emojiApplication.user != null" #suffix>by <MkAcct :user="emojiApplication.user"/></template>

	<div class="_gaps_s">
		<MkFolder :opened="true">
			<template #icon><i class="ti ti-info-circle"></i></template>
			<template #label>{{ i18n.ts.info }}</template>
			<div class="_gaps_s">
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.image }}</template>

					<img v-if="emojiApplication.file != null" :src="emojiApplication.file.url" :class="$style.img" async defer/>
				</MkFolder>
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.category }}</template>
					<div>{{ emojiApplication.category }}</div>
				</MkFolder>
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.tags }}</template>
					<div>{{ emojiApplication.aliases.join(', ') }}</div>
				</MkFolder>
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.license }}</template>
					<div>{{ emojiApplication.license }}</div>
				</MkFolder>
				<div>
					<span v-if="emojiApplication.isSensitive">✅</span>
					<span v-else>❌</span>
					{{ i18n.ts.sensitive }}
				</div>
				<div>
					<span v-if="emojiApplication.localOnly">✅</span>
					<span v-else>❌</span>
					{{ i18n.ts.localOnly }}
				</div>
			</div>
		</MkFolder>
		<MkFolder>
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ i18n.ts._emojiApplication.additionalInfo }}</template>
			<div class="_gaps_s">
				<Mfm
					v-if="emojiApplication.additionalInfo != null && emojiApplication.additionalInfo !== ''"
					:text="emojiApplication.additionalInfo"
				/>
				<div v-else>{{ i18n.ts.nothing }}</div>
			</div>
		</MkFolder>
		<MkFolder>
			<template #icon><i class="ti ti-pencil"></i></template>
			<template #label>{{ i18n.ts.moderationNote }}</template>
			<div class="_gaps_s">
				<MkTextarea v-model="comment" :rows="3"/>
				<MkButton v-if="commentHasChanged" primary @click="submitComment"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</MkFolder>
	</div>
	<template #footer>
		<div v-if="emojiApplication.status === 'pending'" :class="$style.buttons">
			<MkButton primary @click="accept"><i class="ti ti-check"></i> {{ i18n.ts.accept }}</MkButton>
			<MkButton danger @click="reject"><i class="ti ti-x"></i> {{ i18n.ts.reject }}</MkButton>
		</div>
	</template>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineProps, ref, toRefs, watch, defineEmits } from 'vue';
import type * as Misskey from 'misskey-js';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkMention from '@/components/MkMention.vue';
import * as os from '@/os.js';

const props = defineProps<{
	emojiApplication: Misskey.entities.AdminEmojiApplicationsResponse[number];
}>();

const emit = defineEmits<{
	(ev: 'accept', emojiApplication: Misskey.entities.EmojiApplication): void;
	(ev: 'reject', emojiApplication: Misskey.entities.EmojiApplication): void;
}>();

const { emojiApplication } = toRefs(props);
const comment = ref(emojiApplication.value.comment ?? '');
const commentHasChanged = ref(false);

watch(() => comment.value, (before, after) => {
	if (before !== after) {
		commentHasChanged.value = true;
	}
});

async function submitComment () {
	await misskeyApi('admin/emoji-applications/update', {
		emojiApplicationId: emojiApplication.value.id,
		comment: comment.value,
	});
	commentHasChanged.value = false;
	os.success();
}

async function accept () {
	const confirm = await os.confirm({
		type: 'question',
		title: i18n.tsx._emojiApplication.confirmAccept({ name: emojiApplication.value.name }),
	});
	if (confirm.canceled) return;

	misskeyApi('admin/emoji-applications/accept', {
		emojiApplicationId: emojiApplication.value.id,
	}).then(() => {
		emit('accept', { ...emojiApplication.value, status: 'accepted' });
	});
}

async function reject () {
	const confirm = await os.confirm({
		type: 'warning',
		title: i18n.tsx._emojiApplication.confirmReject({ name: emojiApplication.value.name }),
	});
	if (confirm.canceled) return;

	misskeyApi('admin/emoji-applications/reject', {
		emojiApplicationId: emojiApplication.value.id,
	}).then(() => {
		emit('reject', { ...emojiApplication.value, status: 'rejected' });
	});
}
</script>
<style lang="scss" module>
.img {
	width: auto;
	height: 100px;
	object-fit: contain;
}
.dd {
	margin: 0;
}
.buttons {
	display: flex;
	justify-content: flex-start;
	gap: 8px;
}
</style>
