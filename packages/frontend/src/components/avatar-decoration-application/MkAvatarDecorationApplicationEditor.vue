<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkLoading v-if="loading"></MkLoading>
	<div v-else style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<div class="_gaps_m">
				<div :class="$style.preview">
					<div :class="[$style.previewItem, $style.light]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="file?.url != null ? [{url: file.url}] : []" forceShowDecoration/>
					</div>
					<div :class="[$style.previewItem, $style.dark]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="file?.url != null ? [{url: file.url}] : []" forceShowDecoration/>
					</div>
				</div>
				<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ i18n.ts.selectFile }}</MkButton>
				<MkInput v-model="name">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkTextarea v-model="description">
					<template #label>{{ i18n.ts.description }}</template>
				</MkTextarea>
				<MkInfo>{{ i18n.ts._avatarDecorationApplication.additionalInfoDescription }}</MkInfo>
				<MkTextarea v-model="additionalInfo" :mfmAutocomplete="true">
					<template #label>{{ i18n.ts._avatarDecorationApplication.additionalInfo }}</template>
				</MkTextarea>
			</div>
		</MkSpacer>
		<div v-if="status === 'pending'" :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done">
				<i class="ti ti-check"></i> {{ props.avatarDecorationApplication || props.avatarDecorationApplicationId ? i18n.ts.update : i18n.ts.create }}
			</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkTextarea from '@/components/MkTextarea.vue';
import { $i } from '@/i.js';
import { selectFile } from '@/utility/drive.js';

const props = defineProps<{
	avatarDecorationApplicationId?: string,
	avatarDecorationApplication?: Misskey.entities.AvatarDecorationApplication,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

const loading = ref(true);

const file = ref<Misskey.entities.DriveFile | null>(props.avatarDecorationApplication?.file ?? null);
const name = ref<string>(props.avatarDecorationApplication?.name ?? '');
const description = ref<string>(props.avatarDecorationApplication?.description ?? '');
const additionalInfo = ref<string>(props.avatarDecorationApplication?.additionalInfo ?? '');
const status = ref<'pending' | 'canceled' | 'accepted' | 'rejected'>(props.avatarDecorationApplication?.status ?? 'pending');

async function changeImage(ev: Event) {
	file.value = await selectFile(ev.currentTarget ?? ev.target, null);
	const candidate = file.value.name.replace(/\.(.+)$/, '');
	if (candidate.match(/^[a-z0-9_]+$/)) {
		name.value = candidate;
	}
}

async function done() {
	const params = {
		file: file.value,
		fileId: file.value!.id,
		name: name.value,
		description: description.value,
		additionalInfo: additionalInfo.value,
	};

	if (props.avatarDecorationApplication) {
		await os.apiWithDialog('avatar-decoration-applications/update', {
			avatarDecorationApplicationId: props.avatarDecorationApplication.id,
			...params,
		});

		emit('done', {
			updated: {
				id: props.avatarDecorationApplication.id,
				...params,
			},
		});
	} else if (props.avatarDecorationApplicationId != null) {
		await os.apiWithDialog('avatar-decoration-applications/update', {
			avatarDecorationApplicationId: props.avatarDecorationApplicationId,
			...params,
		});

		emit('done', {
			updated: {
				id: props.avatarDecorationApplicationId,
				...params,
			},
		});
	} else {
		const created = await os.apiWithDialog('avatar-decoration-applications/create', params);

		emit('done', {
			created: created,
		});
	}
}

onMounted(() => {
	if (props.avatarDecorationApplicationId != null && props.avatarDecorationApplication == null) {
		(async () => {
			const avatarDecorationApplication = await misskeyApi('avatar-decoration-applications/show', {
				id: props.avatarDecorationApplicationId,
			}) as unknown as Misskey.entities.AvatarDecorationApplication;
			console.log(avatarDecorationApplication);
			name.value = avatarDecorationApplication.name;
			description.value = avatarDecorationApplication.description ?? '';
			additionalInfo.value = avatarDecorationApplication.additionalInfo ?? '';
			file.value = avatarDecorationApplication.file;
			status.value = avatarDecorationApplication.status;

			loading.value = false;
		})();
	} else {
		loading.value = false;
	}
});

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

.footer {
	position: sticky;
	z-index: 10000;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-acrylicBg);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

