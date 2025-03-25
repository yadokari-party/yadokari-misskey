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
						<option value="pending">{{ i18n.ts._avatarDecorationApplication._status.pending }}</option>
						<option value="canceled">{{ i18n.ts._avatarDecorationApplication._status.canceled }}</option>
						<option value="accepted">{{ i18n.ts._avatarDecorationApplication._status.accepted }}</option>
						<option value="rejected">{{ i18n.ts._avatarDecorationApplication._status.rejected }}</option>
					</MkSelect>
				</div>
				<MkPagination ref="avatarDecorationApplicationsPaginationComponent" :pagination="pagination">
					<template #empty><span>{{ i18n.ts._avatarDecorationApplication.noApplications }}</span></template>
					<template #default="{items}">
						<div :class="$style.avatarDecorationApplications">
							<button
								v-for="avatarDecorationApplication in items"
								:key="`emoji-application-${avatarDecorationApplication.id}`"
								:class="[$style.avatarDecorationApplication]"
								class="_panel _button"
								@click="edit(avatarDecorationApplication)"
							>
								<div :class="$style.emojiAppplicationContent">
									<img :src="avatarDecorationApplication.file.thumbnailUrl" :class="$style.img" :alt="avatarDecorationApplication.name"/>
									<div :class="$style.body">
										<div :class="[$style.status, $style[avatarDecorationApplication.status]]">{{ i18n.ts._avatarDecorationApplication._status[avatarDecorationApplication.status] }}</div>
										<div :class="$style.name" class="_monospace">{{ avatarDecorationApplication.name }}</div>
										<div :class="$style.info">{{ avatarDecorationApplication.category }}</div>
									</div>
								</div>
								<div v-if="avatarDecorationApplication.status === 'pending'" @click.stop="cancel(avatarDecorationApplication)"><span><i class="ti ti-x"></i></span></div>
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
import type { Ref } from 'vue';
import type * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { misskeyApi } from '@/scripts/misskey-api';
import MkSelect from '@/components/MkSelect.vue';
import { $i } from '@/account.js';

const avatarDecorationApplicationsPaginationComponent = shallowRef<InstanceType<typeof MkPagination>>();
const status : Ref<'all' | Misskey.entities.AvatarDecorationApplication['status']> = ref('all');

const pagination = {
	endpoint: 'avatar-decoration-applications' as const,
	limit: 30,
	params: computed(() => ({
		status: status.value,
	})),
};

const add = async () => {
	os.popup(defineAsyncComponent(() => import('@/components/avatar-decoration-application/MkAvatarDecorationApplicationEditorDialog.vue')), {}, {
		done: result => {
			avatarDecorationApplicationsPaginationComponent.value?.reload();
		},
	});
};

const edit = (avatarDecorationApplication) => {
	os.popup(defineAsyncComponent(() => import('@/components/avatar-decoration-application/MkAvatarDecorationApplicationEditorDialog.vue')), {
		avatarDecorationApplication: avatarDecorationApplication,
	}, {
		done: result => {
			avatarDecorationApplicationsPaginationComponent.value?.reload();
		},
	});
};

const cancel = async (avatarDecorationApplication) => {
	await os.confirm({ type: 'warning', title: i18n.tsx._avatarDecorationApplication.confirmCancel({ name: avatarDecorationApplication.name }), okText: i18n.ts.cancel, cancelText: i18n.ts.doNothing }).then(async (dialog) => {
		if (dialog.canceled) return;
		await misskeyApi('avatar-decoration-applications/cancel', { avatarDecorationApplicationId: avatarDecorationApplication.id });
		avatarDecorationApplicationsPaginationComponent.value?.reload();
	});
};

const headerActions = computed(() => [
	...($i != null && ($i.isModerator || $i.policies.canCreateAvatarDecorationApplications) ? [{
		asFullButton: true,
		icon: 'ti ti-plus',
		text: i18n.ts.addEmoji,
		handler: add,
	}] : []),
]);

definePageMetadata(() => ({
	title: i18n.ts._avatarDecorationApplication._list.title,
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

.avatarDecorationApplications {
	display: grid;
	grid-template-columns: 1fr;
	grid-gap: 12px;
	margin: var(--MI-margin) 0;
}

.avatarDecorationApplication {
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
