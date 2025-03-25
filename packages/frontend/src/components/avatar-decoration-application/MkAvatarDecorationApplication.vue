<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #icon>
		<i v-if="avatarDecorationApplication.status === 'accepted'" class="ti ti-check" style="color: var(--MI_THEME-success)"></i>
		<i v-else-if="avatarDecorationApplication.status === 'rejected'" class="ti ti-x" style="color: var(--MI_THEME-error)"></i>
		<i v-else-if="avatarDecorationApplication.status === 'canceled'" class="ti ti-slash" style="color: var(--MI_THEME-error)"></i>
		<i v-else class="ti ti-exclamation-circle" style="color: var(--MI_THEME-warn)"></i>
	</template>
	<template #label>{{ avatarDecorationApplication.name }}</template>
	<template v-if="avatarDecorationApplication.user != null" #suffix>by <MkAcct :user="avatarDecorationApplication.user"/></template>

	<div class="_gaps_s">
		<div>{{ avatarDecorationApplication.name }}</div>
		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-info-circle"></i></template>
			<template #label>{{ i18n.ts.info }}</template>
			<div class="_gaps_s">
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.image }}</template>

					<div v-if="avatarDecorationApplication.file != null" :class="$style.preview">
						<div :class="[$style.previewItem, $style.light]">
							<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[{url: avatarDecorationApplication.file.url}]" forceShowDecoration/>
						</div>
						<div :class="[$style.previewItem, $style.dark]">
							<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[{url: avatarDecorationApplication.file.url}]" forceShowDecoration/>
						</div>
					</div>
				</MkFolder>
				<MkFolder>
					<template #label>{{ i18n.ts.description }}</template>
					<template v-if="nullOrEmpty(avatarDecorationApplication.description)" #caption>{{ i18n.ts.nothing }}</template>
					<template v-else #caption>{{ avatarDecorationApplication.description }}</template>
					<div v-if="nullOrEmpty(avatarDecorationApplication.description)">{{ i18n.ts.nothing }}</div>
					<div v-else>{{ avatarDecorationApplication.description }}</div>
				</MkFolder>
			</div>
		</MkFolder>
		<MkFolder>
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ i18n.ts._emojiApplication.additionalInfo }}</template>
			<template v-if="nullOrEmpty(avatarDecorationApplication.additionalInfo)" #caption>
				{{ i18n.ts.nothing }}
			</template>
			<div class="_gaps_s">
				<Mfm
					v-if="avatarDecorationApplication.additionalInfo != null && avatarDecorationApplication.additionalInfo !== ''"
					:text="avatarDecorationApplication.additionalInfo"
				/>
				<div v-else>{{ i18n.ts.nothing }}</div>
			</div>
		</MkFolder>
		<MkFolder>
			<template #icon><i class="ti ti-pencil"></i></template>
			<template #label>{{ i18n.ts.moderationNote }}</template>
			<template v-if="nullOrEmpty(comment)" #caption>
				{{ i18n.ts.nothing }}
			</template>
			<div class="_gaps_s">
				<MkTextarea v-model="comment" :rows="3"/>
				<MkButton v-if="commentHasChanged" primary @click="submitComment"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</MkFolder>
	</div>
	<template #footer>
		<div v-if="avatarDecorationApplication.status === 'pending'" :class="$style.buttons">
			<MkButton primary @click="accept"><i class="ti ti-check"></i> {{ i18n.ts.accept }}</MkButton>
			<MkButton danger @click="reject"><i class="ti ti-x"></i> {{ i18n.ts.reject }}</MkButton>
		</div>
	</template>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineProps, ref, toRefs, watch, defineEmits } from 'vue';
import type * as Misskey from 'misskey-js';
import { signinRequired } from '@/account.js';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';

const $i = signinRequired();

const props = defineProps<{
	avatarDecorationApplication: Misskey.entities.AdminAvatarDecorationApplicationsResponse[number];
}>();

const emit = defineEmits<{
	(ev: 'accept', avatarDecorationApplication: Misskey.entities.AvatarDecorationApplication): void;
	(ev: 'reject', avatarDecorationApplication: Misskey.entities.AvatarDecorationApplication): void;
}>();

const { avatarDecorationApplication } = toRefs(props);
const comment = ref(avatarDecorationApplication.value.comment ?? '');
const commentHasChanged = ref(false);

watch(() => comment.value, (before, after) => {
	if (before !== after) {
		commentHasChanged.value = true;
	}
});

async function submitComment () {
	await misskeyApi('admin/avatar-decoration-applications/update', {
		avatarDecorationApplicationId: avatarDecorationApplication.value.id,
		comment: comment.value,
	});
	commentHasChanged.value = false;
	os.success();
}

async function accept () {
	const confirm = await os.confirm({
		type: 'question',
		title: i18n.tsx._avatarDecorationApplication.confirmAccept({ name: avatarDecorationApplication.value.name }),
	});
	if (confirm.canceled) return;

	misskeyApi('admin/avatar-decoration-applications/accept', {
		avatarDecorationApplicationId: avatarDecorationApplication.value.id,
	}).then(() => {
		emit('accept', { ...avatarDecorationApplication.value, status: 'accepted' });
		os.success();
	});
}

async function reject () {
	const confirm = await os.confirm({
		type: 'warning',
		title: i18n.tsx._avatarDecorationApplication.confirmReject({ name: avatarDecorationApplication.value.name }),
	});
	if (confirm.canceled) return;
	misskeyApi('admin/avatar-decoration-applications/reject', {
		avatarDecorationApplicationId: avatarDecorationApplication.value.id,
	}).then(() => {
		emit('reject', { ...avatarDecorationApplication.value, status: 'rejected' });
		os.success();
	});
}

function nullOrEmpty (str: string | null | undefined) {
	return str == null || str === '';
}
</script>
<style lang="scss" module>
.preview {
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: var(--MI-margin);
}

.previewItem {
	width: 100%;
	height: 100%;
	min-height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--MI-radius);

	&.light {
		background: #eee;
	}

	&.dark {
		background: #222;
	}
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
