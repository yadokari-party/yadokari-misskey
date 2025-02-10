<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<MkLoading v-if="loading"></MkLoading>
	<div v-else style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<div class="_gaps_m">
				<div v-if="imgUrl != null" :class="$style.imgs">
					<div style="background: #000;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #222;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #ddd;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #fff;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
				</div>
				<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ i18n.ts.selectFile }}</MkButton>
				<MkInput v-model="name" pattern="[a-z0-9_]" autocapitalize="off">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkInput v-model="category" :datalist="nonNullCategories">
					<template #label>{{ i18n.ts.category }}</template>
				</MkInput>
				<MkInput v-model="aliases" autocapitalize="off">
					<template #label>{{ i18n.ts.tags }}</template>
					<template #caption>
						{{ i18n.ts.theKeywordWhenSearchingForCustomEmoji }}<br/>
						{{ i18n.ts.setMultipleBySeparatingWithSpace }}
					</template>
				</MkInput>
				<MkInput v-model="license" :mfmAutocomplete="true">
					<template #label>{{ i18n.ts.license }}</template>
				</MkInput>
				<MkSwitch v-model="isSensitive">{{ i18n.ts.sensitive }}</MkSwitch>
				<MkSwitch v-model="localOnly">{{ i18n.ts.localOnly }}</MkSwitch>
				<MkInfo>{{ i18n.ts._emojiApplication.additionalInfoDescription }}</MkInfo>
				<MkTextarea v-model="additionalInfo" :mfmAutocomplete="true">
					<template #label>{{ i18n.ts._emojiApplication.additionalInfo }}</template>
				</MkTextarea>
			</div>
		</MkSpacer>
		<div v-if="props.emojiApplication == null || props.emojiApplication.status === 'pending'" :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done">
				<i class="ti ti-check"></i> {{ isEdit ? i18n.ts.update : i18n.ts.create }}
			</MkButton>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { customEmojiCategories } from '@/custom-emojis.js';
import MkSwitch from '@/components/MkSwitch.vue';
import { selectFile } from '@/scripts/select-file.js';
import MkTextarea from '@/components/MkTextarea.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkInfo from '@/components/MkInfo.vue';

const props = defineProps<{
	emojiApplicationId?: string,
	emojiApplication?: Misskey.entities.EmojiApplication,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { updated?: Misskey.entities.EmojiApplicationsUpdateRequest; created?: Misskey.entities.EmojiApplicationsUpdateRequest }): void,
	(ev: 'closed'): void
}>();

const loading = ref(true);
const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);
const name = ref<string>(props.emojiApplication ? props.emojiApplication.name : '');
const category = ref<string>(props.emojiApplication?.category ? props.emojiApplication.category : '');
const aliases = ref<string>(props.emojiApplication ? props.emojiApplication.aliases.join(' ') : '');
const license = ref<string>(props.emojiApplication?.license ? props.emojiApplication.license : '');
const isSensitive = ref(props.emojiApplication ? props.emojiApplication.isSensitive : false);
const localOnly = ref(props.emojiApplication ? props.emojiApplication.localOnly : false);
const additionalInfo = ref<string>(props.emojiApplication ? props.emojiApplication.additionalInfo ?? '' : '');
const file = ref<Misskey.entities.DriveFile | null>(props.emojiApplication ? props.emojiApplication.file : null);

const isEdit = props.emojiApplicationId != null || props.emojiApplication != null;

const nonNullCategories = customEmojiCategories.value.filter(x => x != null);

const imgUrl = computed(() => file.value ? file.value.url : props.emojiApplication ? props.emojiApplication.file.url : null);

async function changeImage(ev: Event) {
	file.value = await selectFile(ev.currentTarget ?? ev.target, null);
	const candidate = file.value.name.replace(/\.(.+)$/, '');
	if (candidate.match(/^[a-z0-9_]+$/)) {
		name.value = candidate;
	}
}

async function done() {
	if (file.value == null) {
		os.toast('画像を選択してください');
		return;
	}

	type Params = Omit<Required<Misskey.Endpoints['emoji-applications/create']['req']>, 'category'> &
	{
		category: string | null;
	}
	& Partial<{
		emojiApplicationId: Misskey.Endpoints['emoji-applications/update']['req']['emojiApplicationId']
	}>;

	const params : Params = {
		parentId: null,
		name: name.value,
		category: category.value === '' ? null : category.value,
		aliases: aliases.value.split(' ').filter(x => x !== ''),
		license: license.value === '' ? null : license.value,
		isSensitive: isSensitive.value,
		localOnly: localOnly.value,
		fileId: file.value.id,
		additionalInfo: additionalInfo.value,
	};

	if (props.emojiApplicationId ?? props.emojiApplication != null) {
		await os.apiWithDialog('emoji-applications/update', {
			emojiApplicationId: props.emojiApplicationId ?? props.emojiApplication!.id,
			...params,
		});

		emit('done', {
			updated: {
				emojiApplicationId: props.emojiApplicationId ?? props.emojiApplication!.id,
				...params,
				aliases: params.aliases ?? [],
			},
		});

		windowEl.value?.close();
	} else {
		const created = await os.apiWithDialog('emoji-applications/create', params);

		emit('done', {
			created: {
				emojiApplicationId: created.id,
				fileId: file.value.id,
				...created,
			},
		});

		windowEl.value?.close();
	}
}

onMounted(() => {
	if (props.emojiApplicationId != null && props.emojiApplication == null) {
		(async () => {
			const emojiApplication = await misskeyApi('emoji-applications/show', {
				id: props.emojiApplicationId,
			}) as unknown as Misskey.entities.EmojiApplication;
			console.log(emojiApplication);
			name.value = emojiApplication.name;
			category.value = emojiApplication.category ?? '';
			aliases.value = emojiApplication.aliases.join(' ');
			license.value = emojiApplication.license ?? '';
			isSensitive.value = emojiApplication.isSensitive;
			localOnly.value = emojiApplication.localOnly;
			additionalInfo.value = emojiApplication.additionalInfo ?? '';
			file.value = emojiApplication.file;

			loading.value = false;
		})();
	} else {
		loading.value = false;
	}
});

</script>

<style lang="scss" module>
.imgs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}

.imgContainer {
	padding: 8px;
	border-radius: 6px;
}

.img {
	display: block;
	height: 64px;
	width: 64px;
	object-fit: contain;
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
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
