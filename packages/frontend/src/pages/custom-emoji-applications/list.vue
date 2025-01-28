<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><MkPageHeader :actions="headerActions"/></template>
		<MkSpacer :contentMax="900">
			<div :class="$style.container" class="_gaps_s">
				<div :class="$style.inputs">
					<MkSelect v-model="status" style="margin: 0; flex: 1;">
						<template #label>{{ i18n.ts.state }}</template>
						<option value="all">{{ i18n.ts.all }}</option>
						<option value="pending">{{ i18n.ts._emojiApplication._status.pending }}</option>
						<option value="canceled">{{ i18n.ts._emojiApplication._status.canceled }}</option>
						<option value="accepted">{{ i18n.ts._emojiApplication._status.accepted }}</option>
						<option value="rejected">{{ i18n.ts._emojiApplication._status.rejected }}</option>
					</MkSelect>
				</div>
				<MkPagination ref="emojiApplicationsPaginationComponent" :pagination="pagination">
					<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
					<template #default="{items}">
						<div :class="$style.emojiApplications">
							<button
								v-for="emojiApplication in items"
								:key="`emoji-application-${emojiApplication.id}`"
								:class="[$style.emojiApplication]"
								class="_panel _button"
								@click="edit(emojiApplication)"
							>
								<div :class="$style.emojiAppplicationContent">
									<img :src="emojiApplication.file.thumbnailUrl" :class="$style.img" :alt="emojiApplication.name"/>
									<div :class="$style.body">
										<div :class="[$style.status, $style[emojiApplication.status]]">{{ i18n.ts._emojiApplication._status[emojiApplication.status] }}</div>
										<div :class="$style.name" class="_monospace">{{ emojiApplication.name }}</div>
										<div :class="$style.info">{{ emojiApplication.category }}</div>
									</div>
								</div>
								<div v-if="emojiApplication.status === 'pending'" @click.stop="cancel(emojiApplication)"><span><i class="ti ti-x"></i></span></div>
							</button>
						</div>
					</template>
				</MkPagination>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, shallowRef } from 'vue';
import type * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { misskeyApi } from '@/scripts/misskey-api';
import MkSelect from '@/components/MkSelect.vue';
import { $i } from '@/account.js';

const emojiApplicationsPaginationComponent = shallowRef<InstanceType<typeof MkPagination>>();
const status : 'all' | Misskey.entities.EmojiApplication['status'] = ref('all');

const pagination = {
	endpoint: 'emoji-applications' as const,
	limit: 30,
	params: computed(() => ({
		status: status.value,
	})),
};

const add = async () => {
	os.popup(defineAsyncComponent(() => import('@/components/emoji-application/MkEmojiApplicationEditorDialog.vue')), {}, {
		done: result => {
			emojiApplicationsPaginationComponent.value?.reload();
		},
	});
};

const edit = (emojiApplication) => {
	os.popup(defineAsyncComponent(() => import('@/components/emoji-application/MkEmojiApplicationEditorDialog.vue')), {
		emojiApplication: emojiApplication,
	}, {
		done: result => {
			emojiApplicationsPaginationComponent.value?.reload();
		},
	});
};

const cancel = async (emojiApplication) => {
	await os.confirm({ type: 'warning', title: i18n.tsx._emojiApplication.confirmCancel({ name: emojiApplication.name }), okText: i18n.ts.cancel, cancelText: i18n.ts.doNothing }).then(async (dialog) => {
		if (dialog.canceled) return;
		await misskeyApi('emoji-application/cancel', { emojiApplicationId: emojiApplication.id });
		emojiApplicationsPaginationComponent.value?.reload();
	});
};

const headerActions = computed(() => [
	...($i.isModerator || $i.policies.canCreateCustomEmojiApplications ? [{
		asFullButton: true,
		icon: 'ti ti-plus',
		text: i18n.ts.addEmoji,
		handler: add,
	}] : []),
]);

definePageMetadata(() => ({
	title: i18n.ts._emojiApplication._list.title,
	icon: 'ti ti-triangle-plus-2',
}));
</script>

<style lang="scss" module>
.inputs {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}

.empty {
	margin: var(--MI-margin);
}

.emojiApplications {
	display: grid;
	grid-template-columns: 1fr;
	grid-gap: 12px;
	margin: var(--MI-margin) 0;
}

.emojiApplication {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 11px;
	border: solid 1px var(--MI_THEME-panel);

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover);
	}

	&.selected {
		border-color: var(--MI_THEME-accent);
	}
}

.emojiAppplicationContent {
	display: flex;
	align-items: center;
	text-align: left;
}

.img {
	width: 42px;
	height: 42px;
	object-fit: contain;
}

.body {
	padding: 0 0 0 8px;
	white-space: nowrap;
	overflow: hidden;
}

.status {
	display: inline-flex;
	justify-content: center;
	border-style: solid;
	border-width: 1px;
	border-radius: var(--MI-radius);
	// error, warnもある
	font-size: 0.7em;
	padding: 2px 6px;
}

.pending {
	border-color: var(--MI_THEME-warn);
	color: var(--MI_THEME-warn);
}

.canceled {
	border-color: var(--MI_THEME-error);
	color: var(--MI_THEME-error);
}

.rejected {
	border-color: var(--MI_THEME-error);
	color: var(--MI_THEME-error);
}

.accepted {
	border-color: var(--MI_THEME-success);
	color: var(--MI_THEME-success);
}

.name {
	text-overflow: ellipsis;
	overflow: hidden;
}

.info {
	opacity: 0.5;
	text-overflow: ellipsis;
	overflow: hidden;
}
</style>
